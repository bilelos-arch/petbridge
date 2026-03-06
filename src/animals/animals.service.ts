import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { AnimalFiltersDto } from './dto/animal-filters.dto';
import { RejectAnimalDto } from './dto/reject-animal.dto';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { Status } from '@prisma/client';

@Injectable()
export class AnimalsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createAnimal(createAnimalDto: CreateAnimalDto, ownerId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const animal = await prisma.animal.create({
        data: {
          ...createAnimalDto,
          ownerId,
        },
        include: {
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
      status = Status.DISPONIBLE,
      vaccinated,
      spayed,
      dewormed,
      breed,
      color,
      minAge,
      maxAge,
      search,
    } = filters;

    return this.prisma.animal.findMany({
      where: {
        species,
        sex,
        size,
        temperament,
        status,
        vaccinated,
        spayed,
        dewormed,
        breed,
        color,
        age: minAge || maxAge ? {
          ...(minAge ? { gte: minAge } : {}),
          ...(maxAge ? { lte: maxAge } : {}),
        } : undefined,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { breed: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      include: {
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
    });
  }

  async getAnimalById(id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: {
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
      throw new NotFoundException('Animal not found');
    }

    return animal;
  }

  async updateAnimal(id: string, updateAnimalDto: UpdateAnimalDto, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if user is owner or admin
    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new BadRequestException('You are not authorized to update this animal');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedAnimal = await prisma.animal.update({
        where: { id },
        data: updateAnimalDto,
        include: {
          photos: true,
          healthRecords: true,
        },
      });
      return updatedAnimal;
    });
  }

  async deleteAnimal(id: string, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if user is owner or admin
    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new BadRequestException('You are not authorized to delete this animal');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Delete photos from Cloudinary and database
      const photos = await prisma.animalPhoto.findMany({
        where: { animalId: id },
      });

      for (const photo of photos) {
        if (photo.publicId) {
          await this.cloudinaryService.deleteImage(photo.publicId);
        }
      }

      await prisma.animalPhoto.deleteMany({
        where: { animalId: id },
      });

      // Delete health records
      await prisma.healthRecord.deleteMany({
        where: { animalId: id },
      });

      // Delete adoption requests
      await prisma.adoptionRequest.deleteMany({
        where: { animalId: id },
      });

      // Delete animal
      const deletedAnimal = await prisma.animal.delete({
        where: { id },
      });

      return deletedAnimal;
    });
  }

  async uploadPhoto(id: string, file: any, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if user is owner or admin
    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new BadRequestException('You are not authorized to upload photos for this animal');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadImage(file);

      // Check if it's the first photo to set as primary
      const existingPhotosCount = await prisma.animalPhoto.count({
        where: { animalId: id },
      });
      const isPrimary = existingPhotosCount === 0;

      // Create photo record
      const photo = await prisma.animalPhoto.create({
        data: {
          animalId: id,
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary,
        },
      });

      return photo;
    });
  }

  async deletePhoto(animalId: string, photoId: string, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    const photo = await this.prisma.animalPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.animalId !== animalId) {
      throw new BadRequestException('Photo does not belong to this animal');
    }

    // Check if user is owner or admin
    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new BadRequestException('You are not authorized to delete this photo');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Delete from Cloudinary
      if (photo.publicId) {
        await this.cloudinaryService.deleteImage(photo.publicId);
      }

      // Delete from database
      await prisma.animalPhoto.delete({
        where: { id: photoId },
      });

      // If deleted photo was primary, set another as primary if available
      if (photo.isPrimary) {
        const remainingPhotos = await prisma.animalPhoto.findMany({
          where: { animalId },
          orderBy: { createdAt: 'asc' },
        });

        if (remainingPhotos.length > 0) {
          await prisma.animalPhoto.update({
            where: { id: remainingPhotos[0].id },
            data: { isPrimary: true },
          });
        }
      }

      return { message: 'Photo deleted successfully' };
    });
  }

  async createHealthRecord(animalId: string, createHealthRecordDto: CreateHealthRecordDto, userId: string, userRoles: string[]) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal) {
      throw new NotFoundException('Animal not found');
    }

    // Check if user is owner or admin
    if (animal.ownerId !== userId && !userRoles.includes('ADMIN')) {
      throw new BadRequestException('You are not authorized to create health records for this animal');
    }

    return this.prisma.healthRecord.create({
      data: {
        ...createHealthRecordDto,
        animalId,
      },
    });
  }

  async approveAnimal(id: string) {
    return this.prisma.animal.update({
      where: { id },
      data: { status: Status.DISPONIBLE },
    });
  }

  async rejectAnimal(id: string, rejectAnimalDto: RejectAnimalDto) {
    return this.prisma.animal.update({
      where: { id },
      data: {
        status: Status.REJETE,
        rejectedReason: rejectAnimalDto.rejectedReason,
      },
    });
  }

  async getAnimalsByOwner(ownerId: string) {
    return this.prisma.animal.findMany({
      where: { ownerId },
      include: {
        photos: true,
        healthRecords: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}