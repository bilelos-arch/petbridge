import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    const animals = await prisma.animal.findMany({
      select: { 
        id: true, 
        breedId: true,
        breed: true,
        species: true 
      }
    });
    console.log('Animals:', animals);
    
    const breeds = await prisma.breed.findMany();
    console.log('Breeds:', breeds);
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

checkData();