import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Animal, UserProfile, Species, HousingType, Size, Temperament } from '@prisma/client';

@Injectable()
export class MatchingService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMatchingAnimals(userId: string): Promise<(Animal & { matchScore: number; photos: any[]; breed: any })[]> {
    // Récupérer le UserProfile
    const userProfile = await this.prismaService.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return [];
    }

    // Récupérer tous les animaux disponibles ou en cours d'adoption
    const availableAnimals = await this.prismaService.animal.findMany({
      where: { status: { in: ['DISPONIBLE', 'EN_COURS_ADOPTION'] } },
      include: {
        photos: true,
        breed: true,
      },
    });

    // Calculer le score de compatibilité pour chaque animal
    const animalsWithScore = availableAnimals.map((animal) => {
      const score = this.calculateCompatibilityScore(userProfile, animal);
      return { ...animal, matchScore: score };
    });

    // Trier les animaux par score décroissant
    return animalsWithScore.sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateCompatibilityScore(userProfile: UserProfile, animal: Animal): number {
    let score = 0;

    // ESPECE (20pts)
    if (userProfile.preferredSpecies.length === 0 || userProfile.preferredSpecies.includes(animal.species)) {
      score += 20;
    }

    // LOGEMENT (20pts)
    if (userProfile.housingType === 'MAISON_AVEC_JARDIN') {
      score += 20;
    } else if (userProfile.housingType === 'MAISON') {
      score += animal.size !== 'GRAND' ? 15 : 0;
    } else if (userProfile.housingType === 'APPARTEMENT') {
      if (animal.size === 'PETIT') {
        score += 20;
      } else if (animal.size === 'MOYEN') {
        score += 10;
      } else {
        score += 0;
      }
    }

    // ENFANTS (15pts)
    if (!userProfile.hasChildren) {
      score += 15;
    } else {
      score += animal.goodWithKids ? 15 : 0;
    }

    // AUTRES ANIMAUX (15pts)
    if (!userProfile.hasOtherPets) {
      score += 15;
    } else {
      score += animal.goodWithPets ? 15 : 0;
    }

    // EXPERIENCE (15pts)
    if (userProfile.hasPetExperience) {
      score += 15;
    } else {
      score += animal.temperament !== 'PROTECTEUR' ? 10 : 0;
    }

    // TAILLE PREFEREE (15pts)
    if (userProfile.preferredSize.length === 0 || userProfile.preferredSize.includes(animal.size)) {
      score += 15;
    }

    return score;
  }
}