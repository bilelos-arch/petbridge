import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCheckIns() {
  try {
    console.log('Fixing check-ins for adoption d75ac5e5-6a73-4cb3-a984-6035612ed1e0');
    
    // Step 1: Get all check-ins for the specified adoption
    const checkIns = await prisma.checkIn.findMany({
      where: { adoptionId: 'd75ac5e5-6a73-4cb3-a984-6035612ed1e0' },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log(`Found ${checkIns.length} check-ins`);
    
    // Step 2: Display check-ins details for verification
    checkIns.forEach(checkIn => {
      console.log(`- ID: ${checkIn.id}, Number: ${checkIn.checkInNumber}, Created: ${checkIn.createdAt}`);
    });
    
    // Step 3: Delete the duplicate check-ins
    const toDelete = [
      'b2179bc3-6838-4602-86e6-ac51766ab071',
      'efd7cdba-f735-471c-829d-5e6bf9b916bc',
      'f50eee4a-0d6b-4f5e-b91e-b97ca31eab22',
      '2d272900-234e-4f7f-a32a-9c5ac2594287',
    ];
    
    console.log('Deleting duplicate check-ins...');
    const deleteResult = await prisma.checkIn.deleteMany({
      where: { id: { in: toDelete } }
    });
    
    console.log(`Deleted ${deleteResult.count} duplicate check-ins`);
    
    // Step 4: Verify remaining check-ins
    const remainingCheckIns = await prisma.checkIn.findMany({
      where: { adoptionId: 'd75ac5e5-6a73-4cb3-a984-6035612ed1e0' },
      orderBy: { checkInNumber: 'asc' },
    });
    
    console.log(`Remaining check-ins (${remainingCheckIns.length}):`);
    remainingCheckIns.forEach(checkIn => {
      console.log(`- ID: ${checkIn.id}, Number: ${checkIn.checkInNumber}`);
    });
    
    console.log('Check-ins fixed successfully');
  } catch (error) {
    console.error('Error fixing check-ins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCheckIns();