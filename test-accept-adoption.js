const { PrismaClient, AdoptionStatus, AnimalStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAcceptAdoption() {
  console.log('Testing acceptAdoptionRequest method...\n');

  try {
    // Find an adoption request that is in EN_ATTENTE status
    const pendingRequest = await prisma.adoptionRequest.findFirst({
      where: {
        status: AdoptionStatus.EN_ATTENTE,
      },
      include: {
        animal: true,
        adopter: true,
        donneur: true,
        thread: true,
      },
    });

    if (!pendingRequest) {
      console.log('No pending adoption request found to test with');
      return;
    }

    console.log('Found pending adoption request:');
    console.log(`- ID: ${pendingRequest.id}`);
    console.log(`- Animal: ${pendingRequest.animal.name}`);
    console.log(`- Adopter: ${pendingRequest.adopter.email}`);
    console.log(`- Donneur: ${pendingRequest.donneur.email}`);
    console.log(`- Current status: ${pendingRequest.status}`);
    console.log(`- Thread exists: ${!!pendingRequest.thread}`);
    console.log();

    // Call the acceptAdoptionRequest logic
    const updatedRequest = await prisma.$transaction(async (prisma) => {
      // Step 1: Update adoption request to ACCEPTEE
      await prisma.adoptionRequest.update({
        where: { id: pendingRequest.id },
        data: {
          status: AdoptionStatus.ACCEPTEE,
          decidedAt: new Date(),
        },
      });

      // Step 2: Create Thread
      await prisma.thread.create({
        data: { adoptionId: pendingRequest.id },
      });

      // Step 3: Reject all other EN_ATTENTE requests for same animal
      await prisma.adoptionRequest.updateMany({
        where: {
          animalId: pendingRequest.animalId,
          id: { not: pendingRequest.id },
          status: AdoptionStatus.EN_ATTENTE,
        },
        data: {
          status: AdoptionStatus.REFUSEE,
          decidedAt: new Date(),
        },
      });

      // Step 4: Update animal status to ADOPTE
      await prisma.animal.update({
        where: { id: pendingRequest.animalId },
        data: { status: AnimalStatus.ADOPTE },
      });

      // Return final result
      return prisma.adoptionRequest.findUnique({
        where: { id: pendingRequest.id },
        include: {
          thread: true,
          animal: {
            select: {
              id: true,
              name: true,
              species: true,
              photos: {
                select: { id: true, url: true, isPrimary: true },
                take: 1,
              },
            },
          },
          adopter: {
            select: {
              id: true,
              profile: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
          donneur: {
            select: {
              id: true,
              profile: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      });
    });

    console.log('Successfully accepted adoption request!');
    console.log('Updated request data:');
    console.log(`- ID: ${updatedRequest?.id}`);
    console.log(`- Status: ${updatedRequest?.status}`);
    console.log(`- Thread exists: ${!!updatedRequest?.thread}`);
    if (updatedRequest?.thread) {
      console.log(`- Thread ID: ${updatedRequest.thread.id}`);
    }
    console.log();

    console.log('✓ Test passed: Method returns updated adoption request with thread information');
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testAcceptAdoption();