import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedBreeds() {
  try {
    const breeds = [
      { name: 'Berger Allemand', species: 'CHIEN', description: 'Race German Shepherd' },
      { name: 'Labrador', species: 'CHIEN', description: 'Race Labrador Retriever' },
      { name: 'Chat Persan', species: 'CHAT', description: 'Race Persan' }
    ];

    for (const breedData of breeds) {
      const existingBreed = await prisma.breed.findFirst({
        where: {
          name: breedData.name,
          species: breedData.species
        }
      });

      if (!existingBreed) {
        await prisma.breed.create({ data: breedData });
        console.log(`Created breed: ${breedData.name}`);
      } else {
        console.log(`Breed already exists: ${breedData.name}`);
      }
    }

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error seeding breeds:', err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

seedBreeds();