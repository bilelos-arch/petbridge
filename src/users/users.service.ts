import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

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
