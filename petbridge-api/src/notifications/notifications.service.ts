import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) return;

    const message = {
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (e) {
      console.error('Erreur push notification:', e);
    }
  }

  async sendPushToMany(userIds: string[], title: string, body: string, data?: Record<string, any>) {
    await Promise.all(
      userIds.map(userId => this.sendPushNotification(userId, title, body, data))
    );
  }
}