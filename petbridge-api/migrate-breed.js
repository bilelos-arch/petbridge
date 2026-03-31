import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrateBreed() {
  try {
    console.log('Fetching animals with breed...');
    const animalsWithBreed = await prisma.animal.findMany({
      where: { breed: { not: null } },
      select: { id: true, breed: true, species: true }
    });
    console.log('Animals to migrate:', animalsWithBreed);

    for (const animal of animalsWithBreed) {
      console.log(`Processing animal ${animal.id} with breed ${animal.breed}`);
      
      let existingBreed = await prisma.breed.findFirst({
        where: {
          name: animal.breed,
          species: animal.species
        }
      });

      if (!existingBreed) {
        console.log(`Creating breed ${animal.breed} for species ${animal.species}`);
        existingBreed = await prisma.breed.create({
          data: {
            name: animal.breed,
            species: animal.species,
            description: null,
            imageUrl: null
          }
        });
        console.log(`Created breed ${existingBreed.id}`);
      } else {
        console.log(`Breed ${existingBreed.name} already exists (${existingBreed.id})`);
      }

      await prisma.animal.update({
        where: { id: animal.id },
        data: { breedId: existingBreed.id }
      });
      console.log(`Updated animal ${animal.id} to reference breed ${existingBreed.id}`);
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

migrateBreed();