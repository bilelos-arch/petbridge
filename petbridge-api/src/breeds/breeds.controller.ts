
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { BreedsService } from './breeds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../animals/guards/roles.guard';
import { Roles } from '../animals/decorators/roles.decorator';
import { Species } from '@prisma/client';

@Controller('breeds')
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  // Public — accessible sans token
  @Get()
  findAll(@Query('species') species?: Species) {
    return this.breedsService.findAll(species);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.breedsService.findOne(id);
  }

  // Admin only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: {
    name: string;
    species: Species;
    description?: string;
    imageUrl?: string;
  }) {
    return this.breedsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    imageUrl?: string;
  }) {
    return this.breedsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.breedsService.remove(id);
  }

  // Seed — admin only
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  seed() {
    return this.breedsService.seed([
      { name: 'Berger Allemand', species: Species.CHIEN, description: 'Race intelligente et loyale, idéale pour les familles actives.' },
      { name: 'Golden Retriever', species: Species.CHIEN, description: 'Chien doux et affectueux, parfait avec les enfants.' },
      { name: 'Bulldog', species: Species.CHIEN, description: 'Calme et affectueux, adapté à la vie en appartement.' },
      { name: 'Husky', species: Species.CHIEN, description: 'Énergique et indépendant, nécessite beaucoup d\'exercice.' },
      { name: 'Labrador', species: Species.CHIEN, description: 'Très sociable et joueur, excellent chien de famille.' },
      { name: 'Chihuahua', species: Species.CHIEN, description: 'Petit mais courageux, très attaché à son maître.' },
      { name: 'Beagle', species: Species.CHIEN, description: 'Curieux et énergique, aime explorer l\'extérieur.' },
      { name: 'Caniche', species: Species.CHIEN, description: 'Très intelligent et hypoallergénique, facile à dresser.' },
      { name: 'Persan', species: Species.CHAT, description: 'Calme et affectueux, apprécie la vie d\'intérieur.' },
      { name: 'Siamois', species: Species.CHAT, description: 'Très bavard et sociable, aime l\'interaction humaine.' },
      { name: 'Maine Coon', species: Species.CHAT, description: 'Grande race douce et joueuse, s\'entend bien avec les chiens.' },
      { name: 'Bengal', species: Species.CHAT, description: 'Actif et curieux, ressemble à un léopard miniature.' },
      { name: 'Ragdoll', species: Species.CHAT, description: 'Très doux et placide, idéal pour les appartements calmes.' },
      { name: 'British Shorthair', species: Species.CHAT, description: 'Indépendant et tranquille, peu exigeant en attention.' },
    ]);
  }
}