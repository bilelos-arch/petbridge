import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUserFiltersDto } from './dto/admin-user-filters.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../animals/cloudinary/cloudinary.service';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly matchingService: MatchingService,
    ) {}

    async getAdminAllUsers(filters: AdminUserFiltersDto) {
        const { search, isBanned, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (isBanned !== undefined) {
            where.isBanned = isBanned;
        }

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { profile: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        // Remove password and refresh tokens from response
        const sanitizedData = data.map(user => {
            const { password, refreshTokens, ...sanitizedUser } = user as any;
            return sanitizedUser;
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: sanitizedData,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async banUser(userId: string, dto: BanUserDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isBanned: true,
                bannedAt: new Date(),
                bannedReason: dto.reason,
            },
            include: { profile: true },
        });

        const { password, refreshTokens, ...sanitizedUser } = user as any;
        return sanitizedUser;
    }

    async unbanUser(userId: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isBanned: false,
                bannedAt: null,
                bannedReason: null,
            },
            include: { profile: true },
        });

        const { password, refreshTokens, ...sanitizedUser } = user as any;
        return sanitizedUser;
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const { password, refreshTokens, ...result } = user as any;
        return result;
    }

    async updateMe(userId: string, updateUserDto: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateUserDto,
            include: { profile: true },
        });

        const { password, refreshTokens, ...result } = user as any;
        return result;
    }

    async upsertProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                ...updateProfileDto,
            },
            update: updateProfileDto,
        });

        return profile;
    }

    async getUserPublicProfile(userId: string, animalId?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, isActive: true, isBanned: false },
            select: {
                id: true,
                roles: true,
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        city: true,
                        phone: true,
                        housingType: true,
                        surfaceArea: true,
                        hasGarden: true,
                        hasChildren: true,
                        childrenAges: true,
                        hasOtherPets: true,
                        otherPetsDesc: true,
                        hoursAbsent: true,
                        hasPetExperience: true,
                        petExpDesc: true,
                        warningBadge: true,
                        completionBadge: true,
                        saviorBadge: true,
                        saviorCount: true,
                    },
                },
            },
        });

        if (!user || !user.profile) {
            throw new NotFoundException('Profil public introuvable');
        }

        // Calculate match score if animalId is provided
        if (animalId) {
            const adopterProfile = await this.prisma.userProfile.findUnique({
                where: { userId: userId },
            });

            const animal = await this.prisma.animal.findUnique({
                where: { id: animalId },
            });

            if (adopterProfile && animal) {
                const matchScore = this.matchingService.calculateCompatibilityScore(adopterProfile, animal);
                return {
                    ...user,
                    matchScore,
                };
            }
        }

        return user;
    }

    async uploadAvatar(userId: string, file: any) {
        const result = await this.cloudinaryService.uploadImage(file);
        return this.prisma.userProfile.update({
            where: { userId },
            data: { avatarUrl: result.secure_url },
        });
    }

    async getPublicProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
            id: true,
            roles: true,
            profile: {
                select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                city: true,
                phone: true,
                housingType: true,
                surfaceArea: true,
                hasGarden: true,
                hasChildren: true,
                childrenAges: true,
                hasOtherPets: true,
                otherPetsDesc: true,
                hoursAbsent: true,
                hasPetExperience: true,
                petExpDesc: true,
                saviorBadge: true,
                saviorCount: true,
                },
            },
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updatePushToken(userId: string, token: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: token },
        });
    }

    async updateLocation(userId: string, latitude: number, longitude: number) {
        return this.prisma.userProfile.update({
            where: { userId },
            data: {
                lastLatitude: latitude,
                lastLongitude: longitude,
                lastLocationAt: new Date(),
            },
        });
    }
}
