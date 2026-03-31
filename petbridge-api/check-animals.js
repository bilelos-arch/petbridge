import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAnimals() {
  try {
    const animals = await prisma.animal.findMany({
      select: { 
        id: true, 
        breed: true, 
        species: true 
      }
    });
    console.log('Animals:', animals);
  } catch (err) {
    console.error('Error fetching animals:', err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

checkAnimals();