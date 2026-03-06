//Users/mac/Desktop/pet/petbridge-api/src/animals/animals.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { AnimalFiltersDto } from './dto/animal-filters.dto';
import { RejectAnimalDto } from './dto/reject-animal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('animals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  async createAnimal(
    @Body() createAnimalDto: CreateAnimalDto,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.createAnimal(createAnimalDto, user.id);
  }

  @Public()
  @Get()
  async getAnimals(@Query() filters: AnimalFiltersDto) {
    return this.animalsService.getAnimals(filters);
  }

  @Public()
  @Get(':id')
  async getAnimalById(@Param('id') id: string) {
    return this.animalsService.getAnimalById(id);
  }

  @Put(':id')
  async updateAnimal(
    @Param('id') id: string,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.updateAnimal(
      id,
      updateAnimalDto,
      user.id,
      user.roles,
    );
  }

  @Delete(':id')
  async deleteAnimal(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.deleteAnimal(id, user.id, user.roles);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.uploadPhoto(id, file, user.id, user.roles);
  }

  @Delete(':id/photos/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.deletePhoto(id, photoId, user.id, user.roles);
  }

  @Post(':id/health-records')
  async createHealthRecord(
    @Param('id') id: string,
    @Body() createHealthRecordDto: CreateHealthRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.animalsService.createHealthRecord(
      id,
      createHealthRecordDto,
      user.id,
      user.roles,
    );
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN)
  async approveAnimal(@Param('id') id: string) {
    return this.animalsService.approveAnimal(id);
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN)
  async rejectAnimal(
    @Param('id') id: string,
    @Body() rejectAnimalDto: RejectAnimalDto,
  ) {
    return this.animalsService.rejectAnimal(id, rejectAnimalDto);
  }

  @Get('owner/me')
  async getMyAnimals(@CurrentUser() user: any) {
    return this.animalsService.getAnimalsByOwner(user.id);
  }
}