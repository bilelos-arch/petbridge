import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdoptionDto } from './dto/create-adoption.dto';
import { AdoptionFiltersDto } from './dto/adoption-filters.dto';
import { AdoptionStatus, AnimalStatus } from '@prisma/client';
import { CheckInsService } from '../checkins/checkins.service';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class AdoptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkInsService: CheckInsService,
    private readonly matchingService: MatchingService,
    private readonly notificationsService: NotificationsService,
) {}

  /**
   * Get all adoption requests for admin
   */
  async getAllAdoptions(filters: AdoptionFiltersDto) {
    const { status, animalId, adopterId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {} as any;
    if (status) {
      where.status = status;
    }
    if (animalId) {
      where.animalId = animalId;
    }
    if (adopterId) {
      where.adopterId = adopterId;
    }

    const [data, total] = await Promise.all([
      this.prisma.adoptionRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          animal: {
            select: {
              id: true,
              name: true,
              photos: {
                select: {
                  id: true,
                  url: true,
                  isPrimary: true,
                },
                take: 1,
              },
            },
          },
          adopter: {
            select: {
              id: true,
              email: true,
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
              email: true,
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
      }),
      this.prisma.adoptionRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new adoption request
   */
  async createAdoptionRequest(adopterId: string, dto: CreateAdoptionDto) {
    // Check if animal exists and is available
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    if (animal.status !== AnimalStatus.DISPONIBLE) {
      throw new ForbiddenException('Animal is not available for adoption');
    }

    // Check if adopter is not the animal owner
    if (adopterId === animal.ownerId) {
      throw new ForbiddenException('You cannot adopt your own animal');
    }

    // Check if existing EN_ATTENTE request exists
    const existingRequest = await this.prisma.adoptionRequest.findFirst({
      where: {
        animalId: dto.animalId,
        adopterId,
        status: AdoptionStatus.EN_ATTENTE,
      },
    });

    if (existingRequest) {
      throw new ForbiddenException('You already have a pending adoption request for this animal');
    }

    // Create the adoption request
    const adoptionRequest = await this.prisma.adoptionRequest.create({
      data: {
        animalId: dto.animalId,
        adopterId,
        donneurId: animal.ownerId,
        message: dto.message,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            photos: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
              take: 1,
            },
          },
        },
        adopter: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
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
      },
    });

    // Send push notification to animal owner
    const adopteurPrenom = adoptionRequest.adopter?.profile?.firstName || 'Quelqu\'un';
    await this.notificationsService.sendPushNotification(
      animal.ownerId,
      '🐾 Nouvelle demande d\'adoption',
      `${adopteurPrenom} souhaite adopter ${animal?.name}`,
      { type: 'adoption_received', adoptionId: adoptionRequest.id }
    );

    return adoptionRequest;
  }

  /**
   * Get current user's adoption requests as adopter
   */
  async getMyRequests(adopterId: string) {
    return this.prisma.adoptionRequest.findMany({
      where: { adopterId },
      orderBy: { createdAt: 'desc' },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            photos: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
              take: 1,
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
      },
    });
  }

  /**
   * Get adoption requests received by current user as donneur
   */
  async getReceivedRequests(donneurId: string) {
    const requests = await this.prisma.adoptionRequest.findMany({
      where: { donneurId },
      orderBy: { createdAt: 'desc' },
      include: {
        animal: true, // Include complete animal data for scoring
        adopter: {
          select: {
            id: true,
            email: true,
            profile: true, // Include complete profile data for scoring
          },
        },
        thread: true,
      },
    });

    // Calculate match score for each request
    const requestsWithMatchScore = await Promise.all(
      requests.map(async (request) => {
        let matchScore = 0;
        if (request.adopter.profile) {
          matchScore = this.matchingService.calculateCompatibilityScore(
            request.adopter.profile,
            request.animal,
          );
        }

        return {
          ...request,
          matchScore,
        };
      }),
    );

    return requestsWithMatchScore;
  }

  /**
   * Get adoption request by ID
   */
  async getAdoptionRequestById(id: string, userId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
        thread: true,
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            age: true,
            description: true,
            vaccinated: true,
            spayed: true,
            dewormed: true,
            photos: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
            },
            healthRecords: {
              select: {
                id: true,
                title: true,
                description: true,
                date: true,
                veterinarian: true,
              },
              orderBy: { date: 'desc' },
            },
          },
        },
        adopter: {
          select: {
            id: true,
            profile: true,
          },
        },
        donneur: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    if (request.adopterId !== userId && request.donneurId !== userId) {
      throw new ForbiddenException('You do not have access to this adoption request');
    }

    return request;
  }

  /**
   * Cancel an adoption request
   */
  async cancelAdoptionRequest(id: string, userId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: {
        id: true,
        adopterId: true,
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    if (request.adopterId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this request');
    }

    if (request.status !== AdoptionStatus.EN_ATTENTE) {
      throw new ForbiddenException('Only pending requests can be canceled');
    }

    return this.prisma.adoptionRequest.update({
      where: { id },
      data: {
        status: AdoptionStatus.ANNULEE,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            photos: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
              take: 1,
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
      },
    });
  }

  /**
   * Accept an adoption request
   */
  async acceptAdoptionRequest(id: string, donneurId: string) {
    // Get adoption request details
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: {
        id: true,
        donneurId: true,
        status: true,
        animalId: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    // Verify currentUser is the donneur
    if (request.donneurId !== donneurId) {
      throw new ForbiddenException('You do not have permission to accept this request');
    }

    // Verify request is in EN_ATTENTE status
    if (request.status !== AdoptionStatus.EN_ATTENTE) {
      throw new ForbiddenException('Only pending requests can be accepted');
    }

    // Get the full adoption request with adopter info
    const fullRequest = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
        adopter: {
          select: { id: true },
        },
        animal: {
          select: { name: true },
        },
      },
    });

    // Step 1: Update adoption request to ACCEPTEE
    await this.prisma.adoptionRequest.update({
      where: { id },
      data: {
        status: AdoptionStatus.ACCEPTEE,
        decidedAt: new Date(),
      },
    });

    // Step 2: Create Thread
    await this.prisma.thread.create({
      data: { adoptionId: id },
    });

    // Step 3: Reject all other EN_ATTENTE requests for same animal
    await this.prisma.adoptionRequest.updateMany({
      where: {
        animalId: request.animalId,
        id: { not: id },
        status: AdoptionStatus.EN_ATTENTE,
      },
      data: {
        status: AdoptionStatus.REFUSEE,
        decidedAt: new Date(),
      },
    });

    // Step 4: Update animal status to ADOPTE
    const animal = await this.prisma.animal.update({
      where: { id: request.animalId },
      data: { status: AnimalStatus.EN_COURS_ADOPTION },
    });

    // Step 5: Créer les check-ins automatiques J+1, J+3, J+14, J+30
    await this.checkInsService.createAutoCheckIns(id, donneurId);

    // Send push notification to adopter
    if (fullRequest) {
      await this.notificationsService.sendPushNotification(
        fullRequest.adopter.id,
        '✅ Demande acceptée !',
        `Votre demande pour ${fullRequest.animal.name} a été acceptée`,
        { type: 'adoption_accepted', adoptionId: id }
      );
    }

    // Return final result
    return this.prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
        thread: true,
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            photos: {
              select: { id: true, url: true, isPrimary: true },
              take: 1,
            },
          },
        },
        adopter: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        donneur: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Reject an adoption request
   */
  async rejectAdoptionRequest(id: string, donneurId: string, dto: { decisionNote: string }) {
    // Get adoption request details
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: {
        id: true,
        donneurId: true,
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    // Verify currentUser is the donneur
    if (request.donneurId !== donneurId) {
      throw new ForbiddenException('You do not have permission to reject this request');
    }

    // Verify request is in EN_ATTENTE status
    if (request.status !== AdoptionStatus.EN_ATTENTE) {
      throw new ForbiddenException('Only pending requests can be rejected');
    }

    // Update the adoption request
    const adoptionRequest = await this.prisma.adoptionRequest.update({
      where: { id },
      data: {
        status: AdoptionStatus.REFUSEE,
        decisionNote: dto.decisionNote,
        decidedAt: new Date(),
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            photos: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
              take: 1,
            },
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
      },
    });

    // Send push notification to adopter
    await this.notificationsService.sendPushNotification(
      adoptionRequest.adopterId,
      '❌ Demande refusée',
      `Votre demande pour ${adoptionRequest.animal.name} a été refusée`,
      { type: 'adoption_rejected', adoptionId: id }
    );

    return adoptionRequest;
  }

  /**
   * Send a pre-acceptance message to adoption request
   */
  async sendPreAcceptanceMessage(adoptionId: string, userId: string, content: string) {
    // Vérifier que l'user est adoptant ou donneur de cette demande
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id: adoptionId },
      select: { adopterId: true, donneurId: true, status: true }
    });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (userId !== request.adopterId && userId !== request.donneurId)
      throw new ForbiddenException('Non autorisé');

    // Créer le thread si inexistant
    const thread = await this.prisma.thread.upsert({
      where: { adoptionId },
      create: { adoptionId },
      update: {},
    });

    // Créer le message
    const message = await this.prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
          }
        }
      }
    });

    return { threadId: thread.id, message };
  }
}
