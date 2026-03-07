import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Cet email est déjà utilisé');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                roles: ['ADOPTANT'],
            },
        });

        return this.generateTokens(user.id, user.email, user.roles);
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user || !user.password) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Ce compte a été banni');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Ce compte est inactif');
        }

        return this.generateTokens(user.id, user.email, user.roles);
    }

    async refresh(refreshToken: string) {
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: hashedToken },
            include: { user: true },
        });

        if (!tokenRecord) {
            throw new UnauthorizedException('Refresh token invalide');
        }

        if (tokenRecord.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
            throw new UnauthorizedException('Refresh token expiré');
        }

        const { user } = tokenRecord;

        if (user.isBanned) {
            throw new UnauthorizedException('Ce compte a été banni');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Ce compte est inactif');
        }

        // Generate new valid tokens. Also, rotate the refresh token.
        await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        return this.generateTokens(user.id, user.email, user.roles);
    }

    async logout(refreshToken: string) {
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await this.prisma.refreshToken.deleteMany({
            where: { token: hashedToken },
        });
        return { message: 'Déconnexion réussie' };
    }

    private async generateTokens(userId: string, email: string, roles: string[]) {
        const payload = { sub: userId, email, roles };

        const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
        const refreshTokenObj = await this.generateRefreshToken(userId);

        return {
            access_token: accessToken,
            refresh_token: refreshTokenObj.token,
        };
    }

    private async generateRefreshToken(userId: string) {
        const tokenString = crypto.randomUUID() + Date.now().toString();

        // Calculate expiration (7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Hash the token properly with SHA256 to allow db querying
        const hashedToken = crypto.createHash('sha256').update(tokenString).digest('hex');

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: hashedToken,
                expiresAt,
            },
        });

        return { token: tokenString };
    }
}
