import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { AnimalFiltersDto } from './dto/animal-filters.dto';
import { RejectAnimalDto } from './dto/reject-animal.dto';
import { AdminAnimalFiltersDto } from './dto/admin-animal-filters.dto';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnimalStatus, Prisma } from '@prisma/client';

@Injectable()
export class AnimalsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  async createAnimal(createAnimalDto: CreateAnimalDto, ownerId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const animal = await prisma.animal.create({
        data: {
          ...createAnimalDto,
          ownerId,
          originalOwnerId: ownerId, // ← ajouté
        },
        select: {
          id: true,
          ownerId: true,
          originalOwnerId: true,
          name: true,
          species: true,
          sex: true,
          size: true,
          temperament: true,
          age: true,
          description: true,
          vaccinated: true,
          spayed: true,
          dewormed: true,
          color: true,
          birthDate: true,
          medicalConditions: true,
          city: true,
          status: true,
          rejectedReason: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          breedId: true,
          breed: true,
          owner: {
            select: {
              id: true,
              profile: true,
            },
          },
          photos: true,
          healthRecords: true,
        },
      });
      return animal;
    });
  }

  async getAnimals(filters: AnimalFiltersDto) {
    const {
      species,
      sex,
      size,
      temperament,
      status, // ← removed default to allow no status filter
      vaccinated,
      spayed,
      dewormed,
      breedId,
      color,
      minAge,
      maxAge,
      search,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    return this.prisma.animal.findMany({
      where: {
        species,
        sex,
        size,
        temperament,
        status: status ? status : { in: [AnimalStatus.DISPONIBLE, AnimalStatus.EN_COURS_ADOPTION] },
        vaccinated,
        spayed,
        dewormed,
        breedId,
        color,
        age: minAge || maxAge ? {
          ...(minAge ? { gte: minAge } : {}),
          ...(maxAge ? { lte: maxAge } : {}),
        } : undefined,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { breed: { name: { contains: search, mode: 'insensitive' } } },
          { description: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }, // Ajout filtre par ville
        ] : undefined,
      },
      select: {
        id: true,
        ownerId: true,
        originalOwnerId: true,
        name: true,
        species: true,
        sex: true,
        size: true,
        temperament: true,
        age: true,
        description: true,
        vaccinated: true,
        spayed: true,
        dewormed: true,
        color: true,
        birthDate: true,
        medicalConditions: true,
        city: true,
        status: true,
        rejectedReason: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        breedId: true,
        breed: true,
        owner: {
          select: {
            id: true,
            profile: true,
          },
        },
        photos: true,
        healthRecords: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }

  async getAnimalById(id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        originalOwnerId: true,
        name: true,
        species: true,
        sex: true,
        size: true,
        temperament: true,
        age: true,
        description: true,
        vaccinated: true,
        spayed: true,
        dewormed: true,
        color: true,
        birthDate: true,
        medicalConditions: true,
        city: true,
        status: true,
        rejectedReason: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        breedId: true,
        breed: true,
        owner: {
          select: {
            id: true,
            profile: true,
          },
        },
        photos: true,
        healthRecords: true,
        adoptionRequests: true,
      },
    });

    if (!animal) {
      throw new NotFoundException('Animal non trouvé');
    }

    return animal;
  }

  async updateAnimal(id: string, updateAnimalDto: UpdateAnimalDto, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
    });

    if (!animal) {
      throw new NotFoundException('Animal non trouvé');
    }

    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.$transaction(async (prisma) => {
      return prisma.animal.update({
        where: { id },
        data: updateAnimalDto,
        select: {
          id: true,
          ownerId: true,
          originalOwnerId: true,
          name: true,
          species: true,
          sex: true,
          size: true,
          temperament: true,
          age: true,
          description: true,
          vaccinated: true,
          spayed: true,
          dewormed: true,
          color: true,
          birthDate: true,
          medicalConditions: true,
          city: true,
          status: true,
          rejectedReason: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          breedId: true,
          breed: true,
          owner: {
            select: {
              id: true,
              profile: true,
            },
          },
          photos: true,
          healthRecords: true,
        },
      });
    });
  }

  async deleteAnimal(id: string, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
    });

    if (!animal) {
      throw new NotFoundException('Animal non trouvé');
    }

    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.$transaction(async (prisma) => {
      const photos = await prisma.animalPhoto.findMany({
        where: { animalId: id },
      });

      for (const photo of photos) {
        if (photo.publicId) {
          await this.cloudinaryService.deleteImage(photo.publicId);
        }
      }

      await prisma.animalPhoto.deleteMany({ where: { animalId: id } });
      await prisma.healthRecord.deleteMany({ where: { animalId: id } });
      await prisma.adoptionRequest.deleteMany({ where: { animalId: id } });

      return prisma.animal.delete({ where: { id } });
    });
  }

async uploadPhoto(id: string, file: any, userId: string, userRoles: string[]) {
  const animal = await this.prisma.animal.findUnique({ where: { id } });
  if (!animal) throw new NotFoundException('Animal non trouvé');
  if (animal.ownerId !== userId && !userRoles.includes('ADMIN'))
    throw new ForbiddenException('Non autorisé');

  // Upload Cloudinary HORS transaction
  const result = await this.cloudinaryService.uploadImage(file);

  const existingPhotosCount = await this.prisma.animalPhoto.count({
    where: { animalId: id },
  });

  return this.prisma.animalPhoto.create({
    data: {
      animalId: id,
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: existingPhotosCount === 0,
    },
  });
}

  async deletePhoto(animalId: string, photoId: string, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal non trouvé');

    const photo = await this.prisma.animalPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo non trouvée');

    if (photo.animalId !== animalId) {
      throw new BadRequestException('Photo ne correspond pas à cet animal');
    }

    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.$transaction(async (prisma) => {
      if (photo.publicId) {
        await this.cloudinaryService.deleteImage(photo.publicId);
      }

      await prisma.animalPhoto.delete({ where: { id: photoId } });

      if (photo.isPrimary) {
        const remaining = await prisma.animalPhoto.findMany({
          where: { animalId },
          orderBy: { createdAt: 'asc' },
        });

        if (remaining.length > 0) {
          await prisma.animalPhoto.update({
            where: { id: remaining[0].id },
            data: { isPrimary: true },
          });
        }
      }

      return { message: 'Photo supprimée avec succès' };
    });
  }

  async createHealthRecord(animalId: string, dto: CreateHealthRecordDto, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal non trouvé');

    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.healthRecord.create({
      data: { ...dto, animalId },
    });
  }

  async approveAnimal(id: string) {
    const animal = await this.prisma.animal.update({
      where: { id },
      data: {
        status: AnimalStatus.DISPONIBLE,
        publishedAt: new Date(),
      },
    });

    // Send push notification to owner
    await this.notificationsService.sendPushNotification(
      animal.ownerId,
      '✅ Annonce validée !',
      `${animal.name} est maintenant visible par tous`,
      { type: 'animal_approved', animalId: animal.id }
    );

    return animal;
  }

  async rejectAnimal(id: string, dto: RejectAnimalDto) {
    const animal = await this.prisma.animal.update({
      where: { id },
      data: {
        status: AnimalStatus.REJETE,
        rejectedReason: dto.rejectedReason,
      },
    });

    // Send push notification to owner
    await this.notificationsService.sendPushNotification(
      animal.ownerId,
      '❌ Annonce rejetée',
      `Votre annonce pour ${animal.name} a été rejetée`,
      { type: 'animal_rejected', animalId: animal.id }
    );

    return animal;
  }

  async getAnimalsByOwner(ownerId: string) {
    return this.prisma.animal.findMany({
      where: { ownerId },
      select: {
        id: true,
        ownerId: true,
        originalOwnerId: true,
        name: true,
        species: true,
        sex: true,
        size: true,
        temperament: true,
        age: true,
        description: true,
        vaccinated: true,
        spayed: true,
        dewormed: true,
        color: true,
        birthDate: true,
        medicalConditions: true,
        city: true,
        status: true,
        rejectedReason: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        breedId: true,
        breed: true,
        owner: {
          select: {
            id: true,
            profile: true,
          },
        },
        photos: true,
        healthRecords: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminAnimals(filters: AdminAnimalFiltersDto) {
    const { status, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { breed: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        ]
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        select: {
          id: true,
          ownerId: true,
          originalOwnerId: true,
          name: true,
          species: true,
          sex: true,
          size: true,
          temperament: true,
          age: true,
          description: true,
          vaccinated: true,
          spayed: true,
          dewormed: true,
          color: true,
          birthDate: true,
          medicalConditions: true,
          city: true,
          status: true,
          rejectedReason: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          breedId: true,
          breed: true,
          owner: {
            select: {
              email: true,
              profile: true,
            },
          },
          photos: true,
          healthRecords: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.animal.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}