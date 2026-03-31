import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SightingsService } from './sightings.service';
import { CreateSightingDto } from './dto/create-sighting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../animals/guards/roles.guard';
import { Roles } from '../animals/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sightings')
@UseGuards(JwtAuthGuard)
export class SightingsController {
  constructor(private readonly sightingsService: SightingsService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSightingDto,
  ) {
    return this.sightingsService.create(user.id, dto);
  }

  @Get()
  async findAll() {
    return this.sightingsService.findAll();
  }

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 10;

    return this.sightingsService.findNearby(latitude, longitude, radiusKm);
  }

  @Patch(':id/take-charge')
  async takeCharge(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.sightingsService.takeCharge(id, user.id);
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body('status') status: 'SECOURU' | 'NON_TROUVE',
  ) {
    return this.sightingsService.resolve(id, user.id, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sightingsService.findOne(id);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @CurrentUser() user: { id: string },
  ) {
    return this.sightingsService.uploadPhoto(id, user.id, file);
  }
}