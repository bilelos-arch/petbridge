import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdoptionDto } from './dto/create-adoption.dto';
import { AdoptionFiltersDto } from './dto/adoption-filters.dto';
import { AdoptionStatus, AnimalStatus } from '@prisma/client';

@Injectable()
export class AdoptionsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.adoptionRequest.create({
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
    return this.prisma.adoptionRequest.findMany({
      where: { donneurId },
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
      },
    });
  }

  /**
   * Get adoption request by ID
   */
  async getAdoptionRequestById(id: string, userId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
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

   // Execute all operations in a single transaction
   return this.prisma.$transaction(async (prisma) => {
     // Step 1: Update adoption request to ACCEPTEE with decidedAt
     const updatedRequest = await prisma.adoptionRequest.update({
       where: { id },
       data: {
         status: AdoptionStatus.ACCEPTEE,
         decidedAt: new Date(),
       },
       include: {
         thread: true,
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

     // Step 2: Create a new Thread with adoptionId
     await prisma.thread.create({
       data: {
         adoptionId: id,
       },
     });

     // Step 3: Reject all other EN_ATTENTE requests for the same animal
     await prisma.adoptionRequest.updateMany({
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
     await prisma.animal.update({
       where: { id: request.animalId },
       data: { status: AnimalStatus.ADOPTE },
     });

     // Return updated request with thread included
     return await prisma.adoptionRequest.findUnique({
       where: { id },
       include: {
         thread: true,
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
   return this.prisma.adoptionRequest.update({
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
 }
}
