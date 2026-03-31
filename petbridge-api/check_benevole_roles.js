const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkBenevoleRole() {
  try {
    const usersWithBenevoleRole = await prisma.user.findMany({
      where: {
        roles: {
          has: 'BENEVOLE'
        }
      },
      select: {
        id: true,
        email: true,
        roles: true
      }
    });

    console.log('Utilisateurs avec le rôle BENEVOLE:', usersWithBenevoleRole);
    
    if (usersWithBenevoleRole.length > 0) {
      console.log('\nVeuillez mettre à jour ces utilisateurs avant de supprimer le rôle BENEVOLE.');
    } else {
      console.log('\nAucun utilisateur avec le rôle BENEVOLE trouvé.');
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBenevoleRole();