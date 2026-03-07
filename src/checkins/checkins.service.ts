import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Create a new check-in (adopter only)
   */
  async createCheckIn(
    threadId: string,
    currentUserId: string,
    createCheckInDto: CreateCheckInDto,
  ) {
    const { adopterId } = await this.verifyThreadAccess(threadId, currentUserId);

    // Only adopter can create check-ins
    if (currentUserId !== adopterId) {
      throw new ForbiddenException('Only adopter can create check-ins');
    }

    // Use transaction to create check-in and update lastActivityAt
    const checkIn = await this.prisma.$transaction(async (prisma) => {
      // Create check-in
      const newCheckIn = await prisma.checkIn.create({
        data: {
          threadId,
          userId: currentUserId,
          note: createCheckInDto.note,
          photoUrl: createCheckInDto.photoUrl,
        },
        include: {
          user: {
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

      return newCheckIn;
    });

    // Transform user data
    return {
      ...checkIn,
      user: {
        id: checkIn.user.id,
        name: `${checkIn.user.profile?.firstName || ''} ${checkIn.user.profile?.lastName || ''}`.trim(),
        photoUrl: checkIn.user.profile?.avatarUrl,
      },
    };
  }

  /**
   * Get all check-ins for a thread
   */
  async getCheckInsByThreadId(threadId: string, currentUserId: string) {
    await this.verifyThreadAccess(threadId, currentUserId);

    const checkIns = await this.prisma.checkIn.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
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

    // Transform user data
    return checkIns.map((checkIn) => ({
      ...checkIn,
      user: {
        id: checkIn.user.id,
        name: `${checkIn.user.profile?.firstName || ''} ${checkIn.user.profile?.lastName || ''}`.trim(),
        photoUrl: checkIn.user.profile?.avatarUrl,
      },
    }));
  }

  /**
   * Get all check-ins for current user
   */
  async getCheckInsByCurrentUser(currentUserId: string) {
    const checkIns = await this.prisma.checkIn.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        thread: {
          select: {
            id: true,
            lastActivityAt: true,
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
          },
        },
        user: {
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

    // Transform check-ins data to include primary animal photo
    return checkIns.map((checkIn) => {
      const primaryPhoto = checkIn.thread.adoption.animal.photos.find((p) => p.isPrimary) || checkIn.thread.adoption.animal.photos[0];
      
      return {
        ...checkIn,
        thread: {
          ...checkIn.thread,
          adoption: {
            ...checkIn.thread.adoption,
            animal: {
              ...checkIn.thread.adoption.animal,
              photoUrl: primaryPhoto?.url,
            },
          },
        },
        user: {
          id: checkIn.user.id,
          name: `${checkIn.user.profile?.firstName || ''} ${checkIn.user.profile?.lastName || ''}`.trim(),
          photoUrl: checkIn.user.profile?.avatarUrl,
        },
      };
    });
  }
}