import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { SightingStatus, AnimalSituation } from '@prisma/client';
import { CloudinaryService } from '../animals/cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SightingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Helper function to calculate distance using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async create(userId: string, dto: CreateSightingDto) {
    const sighting = await this.prisma.sighting.create({
      data: {
        ...dto,
        reporterId: userId,
      },
    });

    const reporterId = userId;

    // Récupérer tous les users avec token ET position connue
    const usersWithTokens = await this.prisma.user.findMany({
      where: {
        expoPushToken: { not: null },
        id: { not: reporterId },
        profile: {
          lastLatitude: { not: null },
          lastLongitude: { not: null },
        },
      },
      select: {
        id: true,
        expoPushToken: true,
        profile: {
          select: {
            lastLatitude: true,
            lastLongitude: true,
          },
        },
      },
    });

    const situationLabels: Record<string, string> = {
      BLESSE: 'Animal blessé signalé près de vous 🤕',
      EN_BONNE_SANTE: 'Animal errant signalé près de vous 🐾',
      AGRESSIF: 'Animal agressif signalé près de vous ⚡',
      AVEC_PETITS: 'Animaux avec petits signalés près de vous 🐣',
      INCONNU: 'Animal signalé près de vous ❓',
    };

    // Filtrer par distance 10km
    const nearbyMessages = usersWithTokens
      .filter(u => {
        if (!u.profile?.lastLatitude || !u.profile?.lastLongitude) return false;
        const distance = this.calculateDistance(
          sighting.latitude, sighting.longitude,
          u.profile.lastLatitude, u.profile.lastLongitude,
        );
        return distance <= 10;
      })
      .map(u => ({
        to: u.expoPushToken,
        sound: 'default',
        title: '🚨 Alerte animal proche',
        body: situationLabels[sighting.situation] || 'Animal signalé près de vous',
        data: { type: 'sighting_nearby', sightingId: sighting.id },
      }));

    if (nearbyMessages.length > 0) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nearbyMessages),
        });
      } catch (e) {
        console.error('Erreur push sighting:', e);
      }
    }

    return sighting;
  }

  async findAll() {
    return this.prisma.sighting.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNearby(latitude: number, longitude: number, radiusKm = 10) {
    const R = 6371; // Earth's radius in km
    const sightings = await this.prisma.sighting.findMany({
      where: {
        status: 'SIGNALE',
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
      },
    });

    // Filter sightings within the specified radius using Haversine formula
    const nearbySightings = sightings.filter((sighting) => {
      const lat1 = (latitude * Math.PI) / 180;
      const lon1 = (longitude * Math.PI) / 180;
      const lat2 = (sighting.latitude * Math.PI) / 180;
      const lon2 = (sighting.longitude * Math.PI) / 180;

      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c; // Distance in km

      return distance <= radiusKm;
    });

    return nearbySightings;
  }

  async takeCharge(sightingId: string, userId: string) {
    const sighting = await this.prisma.sighting.findUnique({
      where: { id: sightingId },
    });

    if (!sighting) {
      throw new NotFoundException('Signalement non trouvé');
    }

    if (sighting.status !== 'SIGNALE') {
      throw new ForbiddenException('Ce signalement est déjà pris en charge');
    }

    if (sighting.reporterId === userId) {
      throw new ForbiddenException('Vous ne pouvez pas prendre en charge votre propre signalement');
    }

    return this.prisma.sighting.update({
      where: { id: sightingId },
      data: {
        status: 'PRIS_EN_CHARGE',
        volunteerId: userId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
      },
    });
  }

  async resolve(sightingId: string, userId: string, status: 'SECOURU' | 'NON_TROUVE') {
    const sighting = await this.prisma.sighting.findUnique({
      where: { id: sightingId },
    });

    if (!sighting) {
      throw new NotFoundException('Signalement non trouvé');
    }

    if (sighting.volunteerId !== userId) {
      throw new ForbiddenException('Vous nêtes pas assigné à ce signalement');
    }

    // Update sighting status
    const updatedSighting = await this.prisma.sighting.update({
      where: { id: sightingId },
      data: {
        status,
        resolvedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
      },
    });

    // Award savior badge if animal was rescued
    if (status === 'SECOURU') {
      await this.prisma.userProfile.update({
        where: { userId: userId },
        data: {
          saviorBadge: true,
          saviorCount: { increment: 1 },
        },
      });
    }

    return updatedSighting;
  }

  async uploadPhoto(sightingId: string, userId: string, file: any) {
    const sighting = await this.prisma.sighting.findUnique({
      where: { id: sightingId }
    });
    if (!sighting) throw new NotFoundException('Signalement introuvable');
    if (sighting.reporterId !== userId)
      throw new ForbiddenException('Non autorisé');
    
    const result = await this.cloudinaryService.uploadImage(file);
    return this.prisma.sighting.update({
      where: { id: sightingId },
      data: { photoUrl: result.secure_url },
    });
  }

  async findOne(id: string) {
    const sighting = await this.prisma.sighting.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            email: true,
            roles: true,
            profile: true,
          },
        },
      },
    });

    if (!sighting) {
      throw new NotFoundException('Signalement non trouvé');
    }

    return sighting;
  }
}