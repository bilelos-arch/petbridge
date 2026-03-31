import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Verify current user has access to the thread
   */
  private async verifyThreadAccess(
    threadId: string,
    currentUserId: string,
  ): Promise<{ adopterId: string; donneurId: string }> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        adoption: {
          select: {
            adopterId: true,
            donneurId: true,
          },
        },
      },
    });

    if (!thread) {
      throw new ForbiddenException('Thread not found');
    }

    const { adopterId, donneurId } = thread.adoption;

    if (currentUserId !== adopterId && currentUserId !== donneurId) {
      throw new ForbiddenException('Not authorized to access this thread');
    }

    return { adopterId, donneurId };
  }

  /**
   * Get all threads for current user with adoption details and last message
   */
  async getThreadsByCurrentUser(currentUserId: string) {
    // Get all adoptions where current user is adopter or donneur
    const adoptions = await this.prisma.adoptionRequest.findMany({
      where: {
        OR: [
          { adopterId: currentUserId },
          { donneurId: currentUserId },
        ],
      },
      select: {
        id: true,
        status: true,
        adopterId: true,
        donneurId: true,
        animal: {
          select: {
            id: true,
            name: true,
            photos: true,
          },
        },
        adopter: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        donneur: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        thread: {
          select: {
            id: true,
            isActive: true,
            lastActivityAt: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                content: true,
                mediaUrl: true,
                createdAt: true,
                isRead: true,
                sender: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return adoptions
      .filter((adoption) => adoption.thread)
      .map((adoption) => {
        const thread = adoption.thread!; // We already filtered out adoptions without threads
        const lastMessage = thread.messages[0];
        const otherUser =
          currentUserId === adoption.adopterId
            ? adoption.donneur
            : adoption.adopter;

        // Get primary animal photo
        const primaryPhoto = adoption.animal.photos.find((p) => p.isPrimary) || adoption.animal.photos[0];

        return {
          id: thread.id,
          isActive: thread.isActive,
          lastActivityAt: thread.lastActivityAt,
          adoption: {
            id: adoption.id,
            status: adoption.status,
            animal: {
              id: adoption.animal.id,
              name: adoption.animal.name,
              photoUrl: primaryPhoto?.url,
            },
          },
          otherUser: {
            id: otherUser.id,
            name: `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim(),
            photoUrl: otherUser.profile?.avatarUrl,
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            mediaUrl: lastMessage.mediaUrl,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
            sender: {
              id: lastMessage.sender.id,
              name: `${lastMessage.sender.profile?.firstName || ''} ${lastMessage.sender.profile?.lastName || ''}`.trim(),
              photoUrl: lastMessage.sender.profile?.avatarUrl,
            },
          } : null,
        };
      })
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }

  /**
   * Get thread with messages
   */
  async getThreadById(threadId: string, currentUserId: string) {
    await this.verifyThreadAccess(threadId, currentUserId);

    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        adoption: {
          select: {
            id: true,
            status: true,
            animal: {
              select: {
                id: true,
                name: true,
                photos: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            mediaUrl: true,
            createdAt: true,
            isRead: true,
            sender: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new ForbiddenException('Thread not found');
    }

    // Transform thread data to include primary animal photo and user names
    return {
      ...thread,
      adoption: {
        ...thread.adoption,
        animal: {
          ...thread.adoption.animal,
          photoUrl: thread.adoption.animal.photos.find((p) => p.isPrimary)?.url || thread.adoption.animal.photos[0]?.url,
        },
      },
      messages: thread.messages.map((msg) => ({
        ...msg,
        sender: {
          id: msg.sender.id,
          name: `${msg.sender.profile?.firstName || ''} ${msg.sender.profile?.lastName || ''}`.trim(),
          photoUrl: msg.sender.profile?.avatarUrl,
        },
      })),
    };
  }

  /**
   * Send a new message in a thread (with transaction)
   */
  async sendMessage(
    threadId: string,
    currentUserId: string,
    createMessageDto: CreateMessageDto,
  ) {
    await this.verifyThreadAccess(threadId, currentUserId);

    // Use transaction to create message and update lastActivityAt
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create message
      const message = await prisma.message.create({
        data: {
          threadId,
          senderId: currentUserId,
          content: createMessageDto.content,
          mediaUrl: createMessageDto.mediaUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Update lastActivityAt
      await prisma.thread.update({
        where: { id: threadId },
        data: { lastActivityAt: new Date() },
      });

      return message;
    });

    // Transform sender data
    const transformedResult = {
      ...result,
      sender: {
        id: result.sender.id,
        name: `${result.sender.profile?.firstName || ''} ${result.sender.profile?.lastName || ''}`.trim(),
        photoUrl: result.sender.profile?.avatarUrl,
      },
    };

    // Notification push au destinataire
    try {
      const thread = await this.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          adoption: {
            select: {
              adopterId: true,
              donneurId: true,
              animal: { select: { name: true } },
            },
          },
        },
      });

      if (thread) {
        const recipientId = thread.adoption.adopterId === currentUserId
          ? thread.adoption.donneurId
          : thread.adoption.adopterId;

        const senderName = `${result.sender.profile?.firstName || ''} ${result.sender.profile?.lastName || ''}`.trim();

        await this.notificationsService.sendPushNotification(
          recipientId,
          `💬 ${senderName}`,
          createMessageDto.content.length > 60
            ? createMessageDto.content.substring(0, 60) + '...'
            : createMessageDto.content,
          { type: 'new_message', threadId, animalName: thread.adoption.animal.name },
        );
      }
    } catch (e) {
      console.error('Erreur notif message:', e);
    }

    return transformedResult;
  }

  /**
   * Mark unread messages as read for current user
   */
  async markMessagesAsRead(threadId: string, currentUserId: string) {
    const { adopterId, donneurId } = await this.verifyThreadAccess(
      threadId,
      currentUserId,
    );

    // Determine which messages to mark as read (sent by other user)
    const otherUserId =
      currentUserId === adopterId ? donneurId : adopterId;

    await this.prisma.message.updateMany({
      where: {
        threadId,
        senderId: otherUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * Soft close thread (admin only)
   */
  async closeThread(threadId: string) {
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { isActive: false },
    });

    return { success: true, message: 'Thread closed successfully' };
  }
}