import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyAccess(adoptionId: string, userId: string) {
    const adoption = await this.prisma.adoptionRequest.findUnique({
      where: { id: adoptionId },
      select: { adopterId: true, donneurId: true, status: true },
    });
    if (!adoption) throw new NotFoundException('Adoption not found');
    if (userId !== adoption.adopterId && userId !== adoption.donneurId)
      throw new ForbiddenException('Not authorized');
    return adoption;
  }

  private transform(c: any) {
    const primaryPhoto = c.adoption?.animal?.photos?.find((p: any) => p.isPrimary) || c.adoption?.animal?.photos?.[0];
    return {
      ...c,
      adoption: c.adoption ? {
        ...c.adoption,
        animal: { ...c.adoption.animal, photoUrl: primaryPhoto?.url },
      } : undefined,
      requestedBy: c.requestedBy ? {
        id: c.requestedBy.id,
        name: `${c.requestedBy.profile?.firstName || ''} ${c.requestedBy.profile?.lastName || ''}`.trim(),
        photoUrl: c.requestedBy.profile?.avatarUrl,
      } : null,
      respondedBy: c.respondedBy ? {
        id: c.respondedBy.id,
        name: `${c.respondedBy.profile?.firstName || ''} ${c.respondedBy.profile?.lastName || ''}`.trim(),
        photoUrl: c.respondedBy.profile?.avatarUrl,
      } : null,
    };
  }

private includeBase() {
  return {
    requestedBy: {
      include: {
        profile: true,
      },
    },
    respondedBy: {
      include: {
        profile: true,
      },
    },
    adoption: {
      include: {
        animal: {
          include: {
            photos: true,
          },
        },
      },
    },
  } as any;
}

  /**
   * Créer un check-in manuel (annonceur OU adoptant peut initier)
   */
  async createCheckIn(adoptionId: string, userId: string, dto: { message?: string; scheduledFor?: string }) {
    await this.verifyAccess(adoptionId, userId);
    const checkIn = await this.prisma.checkIn.create({
      data: {
        adoptionId,
        requestedById: userId,
        message: dto.message,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        status: 'EN_ATTENTE',
      },
      include: this.includeBase(),
    });
    return this.transform(checkIn);
  }

  /**
   * Créer les check-ins automatiques après acceptation adoption
   * J+1, J+3, J+14, J+30 — appelé par adoptionsService
   */
  async createAutoCheckIns(adoptionId: string, donneurId: string) {
    // Vérifier si des check-ins existent déjà
    const existing = await this.prisma.checkIn.findFirst({
      where: { adoptionId }
    });
    
    if (existing) {
      throw new Error('Les check-ins existent déjà pour cette adoption');
    }
    
    const now = new Date();
    const delays = [
      { days: 1, number: 1 },
      { days: 3, number: 2 },
      { days: 14, number: 3 },
      { days: 30, number: 4 },
    ];
    
    for (const delay of delays) {
      const scheduledFor = new Date(now);
      scheduledFor.setDate(scheduledFor.getDate() + delay.days);
      await this.prisma.checkIn.create({
        data: {
          adoptionId,
          requestedById: donneurId,
          scheduledFor,
          dueDate: scheduledFor,
          checkInNumber: delay.number,
          message: `Check-in J+${delay.days} : comment va l'animal ?`,
          status: 'EN_ATTENTE',
        },
      });
    }
  }

  /**
   * Répondre à un check-in (l'autre partie)
   */
  async respondToCheckIn(checkInId: string, userId: string, dto: { responseNote?: string; photoUrl?: string; wellbeingScore?: number }) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { adoption: { select: { adopterId: true, donneurId: true, animalId: true } } },
    });
    if (!checkIn) throw new NotFoundException('Check-in not found');
    if (userId !== checkIn.adoption.adopterId && userId !== checkIn.adoption.donneurId)
      throw new ForbiddenException('Not authorized');
    if (checkIn.requestedById === userId)
      throw new ForbiddenException('Cannot respond to your own check-in');
    if (checkIn.status === 'COMPLETE')
      throw new ForbiddenException('Check-in already completed');

    const updated = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        respondedById: userId,
        status: 'COMPLETE',
        responseNote: dto.responseNote,
        photoUrl: dto.photoUrl,
        wellbeingScore: dto.wellbeingScore,
        respondedAt: new Date(),
      },
      include: this.includeBase(),
    });

    // Vérifier si tous les check-ins sont complétés
    const allCheckIns = await this.prisma.checkIn.findMany({
      where: { adoptionId: checkIn.adoptionId },
      include: { adoption: { select: { adopterId: true, animalId: true } } },
    });
    const allComplete = allCheckIns.every(c => c.status === 'COMPLETE');

    if (allComplete) {
      // Mettre à jour l'animal et l'adoption
      await Promise.all([
        // Passer l'animal à ADOPTE
        this.prisma.animal.update({
          where: { id: checkIn.adoption.animalId },
          data: { status: 'ADOPTE' },
        }),
        // Passer l'adoption à COMPLETEE
        this.prisma.adoptionRequest.update({
          where: { id: checkIn.adoptionId },
          data: { status: 'COMPLETEE', completedAt: new Date() },
        }),
        // Mettre le badge de completion sur le profil de l'adoptant
        this.prisma.userProfile.update({
          where: { userId: checkIn.adoption.adopterId },
          data: { completionBadge: true },
        }),
      ]);
    }

    return this.transform(updated);
  }

  /**
   * Vérifier les check-ins en retard
   * Pour les check-ins EN_ATTENTE dont dueDate < now - 2 jours
   */
  async checkLateCheckIns() {
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Trouver les check-ins en retard
    const lateCheckIns = await this.prisma.checkIn.findMany({
      where: {
        status: 'EN_ATTENTE',
        dueDate: { lt: twoDaysAgo },
      },
      include: { adoption: { select: { adopterId: true } } },
    });

    // Mettre à jour les check-ins et les profils
    for (const checkIn of lateCheckIns) {
      await Promise.all([
        // Mettre isLate à true sur le check-in
        this.prisma.checkIn.update({
          where: { id: checkIn.id },
          data: { isLate: true },
        }),
        // Incrémenter le warningCount sur le profil de l'adoptant
        this.prisma.userProfile.update({
          where: { userId: checkIn.adoption.adopterId },
          data: {
            warningCount: { increment: 1 },
            warningBadge: true, // Définir sur true si warningCount >= 1
          },
        }),
      ]);
    }

    return lateCheckIns.length;
  }

  /**
   * Liste des check-ins d'une adoption
   */
  async getCheckInsByAdoption(adoptionId: string, userId: string) {
    await this.verifyAccess(adoptionId, userId);
    const checkIns = await this.prisma.checkIn.findMany({
      where: { adoptionId },
      orderBy: { createdAt: 'asc' },
      include: this.includeBase(),
    });
    return checkIns.map(c => this.transform(c));
  }

  /**
   * Tous les check-ins de l'utilisateur courant
   */
  async getMyCheckIns(userId: string) {
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        OR: [{ requestedById: userId }, { respondedById: userId },
          { adoption: { OR: [{ adopterId: userId }, { donneurId: userId }] } }],
      },
      orderBy: { createdAt: 'asc' },
      include: this.includeBase(),
    });
    return checkIns.map(c => this.transform(c));
  }

  /**
   * Get check-in timeline for an adoption
   */
  async getTimeline(adoptionId: string, userId: string) {
    await this.verifyAccess(adoptionId, userId);
    
    const checkIns = await this.prisma.checkIn.findMany({
      where: { adoptionId },
      orderBy: { checkInNumber: 'asc' },
      include: this.includeBase(),
    });

    const progress = checkIns.filter(c => c.status === 'COMPLETE').length;
    const total = checkIns.length;
    const isComplete = progress === total;
    const nextDueDate = checkIns.find(c => c.status === 'EN_ATTENTE' && c.dueDate)?.dueDate;
    const hasLate = checkIns.some(c => c.isLate);

    return {
      checkIns: checkIns.map(c => this.transform(c)),
      progress,
      total,
      isComplete,
      nextDueDate,
      hasLate,
    };
  }
}