import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateAnimalBreed() {
  try {
    const breed = await prisma.breed.findFirst({
      where: { name: 'Berger Allemand', species: 'CHIEN' }
    });
    
    if (breed) {
      await prisma.animal.updateMany({
        where: { 
          breedId: null,
          species: 'CHIEN'
        },
        data: { breedId: breed.id }
      });
      console.log('Updated animals with breed: ', breed.name);
    }
  } catch (err) {
    console.error('Error updating animal breed:', err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

updateAnimalBreed();