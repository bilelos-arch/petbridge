import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendCheckInReminders() {
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Check-ins dont la dueDate est dans les 2 prochaines heures
    const dueSoon = await this.prisma.checkIn.findMany({
      where: {
        status: 'EN_ATTENTE',
        dueDate: {
          gte: now,
          lte: in2Hours,
        },
      },
      include: {
        adoption: {
          include: {
            animal: { select: { name: true } },
            adopter: { select: { id: true } },
          },
        },
      },
    });

    for (const checkIn of dueSoon) {
      await this.notificationsService.sendPushNotification(
        checkIn.adoption.adopter.id,
        '🐾 Check-in à faire',
        `Comment va ${checkIn.adoption.animal.name} ? Partagez des nouvelles !`,
        { type: 'checkin_due', checkInId: checkIn.id }
      );
    }

    // Check-ins en retard (isLate = false mais dueDate dépassée)
    const late = await this.prisma.checkIn.findMany({
      where: {
        status: 'EN_ATTENTE',
        isLate: false,
        dueDate: { lt: now },
      },
      include: {
        adoption: {
          include: {
            animal: { select: { name: true } },
            adopter: { select: { id: true } },
          },
        },
      },
    });

    for (const checkIn of late) {
      // Marquer comme en retard
      await this.prisma.checkIn.update({
        where: { id: checkIn.id },
        data: { isLate: true },
      });

      // Incrémenter le warning
      await this.prisma.userProfile.update({
        where: { userId: checkIn.adoption.adopter.id },
        data: { warningCount: { increment: 1 }, warningBadge: true },
      });

      await this.notificationsService.sendPushNotification(
        checkIn.adoption.adopter.id,
        '⚠️ Check-in en retard',
        `Le check-in pour ${checkIn.adoption.animal.name} est en retard !`,
        { type: 'checkin_late', checkInId: checkIn.id }
      );
    }
  }
}