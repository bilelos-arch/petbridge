import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Species } from '@prisma/client';

const DEFAULT_BREEDS = [
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
];

@Injectable()
export class BreedsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    console.log('Initializing breeds...');
    const seededBreeds = await this.seed(DEFAULT_BREEDS);
    console.log(`Seeded ${seededBreeds.length} new breeds`);
  }

  async findAll(species?: Species) {
    return this.prisma.breed.findMany({
      where: species ? { species } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const breed = await this.prisma.breed.findUnique({
      where: { id },
      include: { animals: false },
    });
    if (!breed) throw new NotFoundException('Race introuvable');
    return breed;
  }

  async create(data: {
    name: string;
    species: Species;
    description?: string;
    imageUrl?: string;
  }) {
    const existing = await this.prisma.breed.findUnique({
      where: { name_species: { name: data.name, species: data.species } },
    });
    if (existing) throw new ConflictException('Cette race existe déjà');
    return this.prisma.breed.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
  }) {
    await this.findOne(id);
    return this.prisma.breed.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.breed.delete({ where: { id } });
  }

  async seed(breeds: { name: string; species: Species; description: string }[]) {
    const results: any[] = [];
    for (const breed of breeds) {
      const existing = await this.prisma.breed.findUnique({
        where: { name_species: { name: breed.name, species: breed.species } },
      });
      if (!existing) {
        results.push(await this.prisma.breed.create({ data: breed }));
      }
    }
    return results;
  }
}