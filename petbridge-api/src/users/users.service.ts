import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUserFiltersDto } from './dto/admin-user-filters.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

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

    async getUserPublicProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, isActive: true, isBanned: false },
            include: { profile: true },
        });

        if (!user || !user.profile) {
            throw new NotFoundException('Profil public introuvable');
        }

        return {
            firstName: user.profile.firstName,
            city: user.profile.city,
            avatarUrl: user.profile.avatarUrl,
        };
    }
}
