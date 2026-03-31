import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Photos publiques (Unsplash - animaux réels) ───
const PHOTOS = {
  cats: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800',
    'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800',
    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800',
  ],
  dogs: [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    'https://images.unsplash.com/photo-1534361960057-19f4434a5d36?w=800',
    'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800',
  ],
  others: [
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=800',
  ],
  avatars: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=bilel',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=sarra',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=amine',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=leila',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=mehdi',
  ],
};

async function main() {
  console.log('🌱 Début du seed complet PetBridge...\n');

  // ─── Nettoyage ───
  console.log('🧹 Nettoyage de la base...');
  await prisma.checkIn.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.adoptionRequest.deleteMany();
  await prisma.animalPhoto.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.sighting.deleteMany();
  await prisma.report.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Base nettoyée\n');

  const password = await bcrypt.hash('Test1234!', 10);

  // ─────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────
  console.log('👤 Création des utilisateurs...');

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@petbridge.com',
      password,
      roles: ['ADMIN'],
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'PetBridge',
          phone: '71000000',
          city: 'Tunis',
          housingType: 'APPARTEMENT',
          surfaceArea: 100,
          hasGarden: false,
          hasChildren: false,
          childrenAges: [],
          hasOtherPets: false,
          hoursAbsent: 0,
          hasPetExperience: true,
          preferredSpecies: [],
          preferredSize: [],
        },
      },
    },
  });

  // Donneur 1 - Sarra (expérimentée, maison avec jardin)
  const donneur1 = await prisma.user.create({
    data: {
      email: 'donneur@petbridge.com',
      password,
      roles: ['DONNEUR'],
      profile: {
        create: {
          firstName: 'Sarra',
          lastName: 'Ben Ali',
          phone: '22000001',
          city: 'Tunis',
          housingType: 'MAISON_AVEC_JARDIN',
          surfaceArea: 200,
          hasGarden: true,
          hasChildren: true,
          childrenAges: [5, 8],
          hasOtherPets: false,
          hoursAbsent: 4,
          hasPetExperience: true,
          petExpDesc: '10 ans avec des chats et chiens',
          avatarUrl: PHOTOS.avatars[1],
          preferredSpecies: [],
          preferredSize: [],
        },
      },
    },
  });

  // Donneur 2 - Mehdi (appartement)
  const donneur2 = await prisma.user.create({
    data: {
      email: 'donneur2@petbridge.com',
      password,
      roles: ['DONNEUR'],
      profile: {
        create: {
          firstName: 'Mehdi',
          lastName: 'Khelifi',
          phone: '22000002',
          city: 'Sfax',
          housingType: 'MAISON',
          surfaceArea: 150,
          hasGarden: false,
          hasChildren: false,
          childrenAges: [],
          hasOtherPets: true,
          otherPetsDesc: 'Un chien Labrador',
          hoursAbsent: 6,
          hasPetExperience: true,
          petExpDesc: '5 ans avec des chiens',
          avatarUrl: PHOTOS.avatars[4],
          preferredSpecies: [],
          preferredSize: [],
        },
      },
    },
  });

  // Adoptant 1 - Bilel (appartement, pas d'expérience)
  const adoptant1 = await prisma.user.create({
    data: {
      email: 'adoptant@petbridge.com',
      password,
      roles: ['ADOPTANT'],
      profile: {
        create: {
          firstName: 'Bilel',
          lastName: 'Cherni',
          phone: '22000003',
          city: 'Tunis',
          housingType: 'APPARTEMENT',
          surfaceArea: 80,
          hasGarden: false,
          hasChildren: false,
          childrenAges: [],
          hasOtherPets: false,
          hoursAbsent: 8,
          hasPetExperience: false,
          avatarUrl: PHOTOS.avatars[0],
          preferredSpecies: ['CHAT'],
          preferredSize: ['PETIT', 'MOYEN'],
        },
      },
    },
  });

  // Adoptant 2 - Amine (maison avec enfants)
  const adoptant2 = await prisma.user.create({
    data: {
      email: 'adoptant2@petbridge.com',
      password,
      roles: ['ADOPTANT'],
      profile: {
        create: {
          firstName: 'Amine',
          lastName: 'Trabelsi',
          phone: '22000004',
          city: 'Sfax',
          housingType: 'MAISON',
          surfaceArea: 120,
          hasGarden: false,
          hasChildren: true,
          childrenAges: [3, 7],
          hasOtherPets: false,
          hoursAbsent: 4,
          hasPetExperience: true,
          petExpDesc: 'Grandi avec des chiens',
          avatarUrl: PHOTOS.avatars[2],
          preferredSpecies: ['CHIEN'],
          preferredSize: ['PETIT', 'MOYEN'],
        },
      },
    },
  });

  // Adoptant 3 - Leila (maison avec jardin, très expérimentée)
  const adoptant3 = await prisma.user.create({
    data: {
      email: 'adoptant3@petbridge.com',
      password,
      roles: ['ADOPTANT'],
      profile: {
        create: {
          firstName: 'Leila',
          lastName: 'Mansouri',
          phone: '22000005',
          city: 'Tunis',
          housingType: 'MAISON_AVEC_JARDIN',
          surfaceArea: 180,
          hasGarden: true,
          hasChildren: false,
          childrenAges: [],
          hasOtherPets: false,
          hoursAbsent: 2,
          hasPetExperience: true,
          petExpDesc: 'Vétérinaire de formation',
          avatarUrl: PHOTOS.avatars[3],
          preferredSpecies: [],
          preferredSize: [],
          completionBadge: true,
        },
      },
    },
  });

  console.log('✅ 6 utilisateurs créés\n');

  // ─────────────────────────────────────────
  // ANIMAUX
  // ─────────────────────────────────────────
  console.log('🐾 Création des animaux...');

  // ── CHATS ──

  // 1. Luna - Chat DISPONIBLE (score élevé pour Bilel)
  const luna = await prisma.animal.create({
    data: {
      ownerId: donneur1.id,
      originalOwnerId: donneur1.id,
      name: 'Luna',
      species: 'CHAT',
      sex: 'FEMELLE',
      size: 'PETIT',
      temperament: 'CALME',
      age: 24,
      description: 'Luna est une chatte douce et affectueuse qui adore les câlins. Elle est parfaite pour un appartement et s\'entend bien avec tout le monde. Elle aime se blottir contre vous le soir.',
      vaccinated: true,
      spayed: true,
      dewormed: true,
      city: 'Tunis',
      status: 'DISPONIBLE',
      goodWithKids: true,
      goodWithPets: true,
      activityLevel: 'FAIBLE',
      publishedAt: new Date(),
      photos: {
        create: [
          { url: PHOTOS.cats[0], isPrimary: true },
          { url: PHOTOS.cats[1], isPrimary: false },
        ],
      },
      healthRecords: {
        create: [
          {
            title: 'Vaccination annuelle',
            description: 'Vaccins rage, typhus, leucose à jour',
            date: new Date('2024-06-15'),
            veterinarian: 'Dr. Hamdi',
          },
          {
            title: 'Stérilisation',
            description: 'Opération réussie, récupération complète',
            date: new Date('2023-12-01'),
            veterinarian: 'Dr. Hamdi',
          },
        ],
      },
    },
  });

  // 2. Milo - Chat EN_COURS_ADOPTION
  const milo = await prisma.animal.create({
    data: {
      ownerId: donneur1.id,
      originalOwnerId: donneur1.id,
      name: 'Milo',
      species: 'CHAT',
      sex: 'MALE',
      size: 'MOYEN',
      temperament: 'JOUEUR',
      age: 12,
      description: 'Milo est un jeune chat Bengal plein d\'énergie. Il adore jouer et explorer. Il a besoin d\'un environnement stimulant et de beaucoup d\'attention.',
      vaccinated: false,
      spayed: false,
      dewormed: true,
      city: 'Tunis',
      status: 'EN_COURS_ADOPTION',
      goodWithKids: true,
      goodWithPets: true,
      activityLevel: 'ELEVE',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.cats[2], isPrimary: true },
          { url: PHOTOS.cats[3], isPrimary: false },
        ],
      },
    },
  });

  // 3. Nala - Chat DISPONIBLE
  const nala = await prisma.animal.create({
    data: {
      ownerId: donneur2.id,
      originalOwnerId: donneur2.id,
      name: 'Nala',
      species: 'CHAT',
      sex: 'FEMELLE',
      size: 'PETIT',
      temperament: 'TIMIDE',
      age: 36,
      description: 'Nala est une chatte timide qui a besoin de temps pour s\'apprivoiser. Une fois en confiance, elle devient très affectueuse. Idéale pour une maison calme sans enfants en bas âge.',
      vaccinated: true,
      spayed: true,
      dewormed: true,
      city: 'Sfax',
      status: 'DISPONIBLE',
      goodWithKids: false,
      goodWithPets: false,
      activityLevel: 'FAIBLE',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.cats[4], isPrimary: true },
        ],
      },
    },
  });

  // 4. Simba - Chat ADOPTE (parcours terminé)
  const simba = await prisma.animal.create({
    data: {
      ownerId: donneur1.id,
      originalOwnerId: donneur1.id,
      name: 'Simba',
      species: 'CHAT',
      sex: 'MALE',
      size: 'GRAND',
      temperament: 'PROTECTEUR',
      age: 48,
      description: 'Simba a trouvé sa famille pour toujours !',
      vaccinated: true,
      spayed: true,
      dewormed: true,
      city: 'Tunis',
      status: 'ADOPTE',
      goodWithKids: false,
      goodWithPets: false,
      activityLevel: 'MOYEN',
      publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.cats[0], isPrimary: true },
        ],
      },
    },
  });

  // ── CHIENS ──

  // 5. Rex - Chien DISPONIBLE
  const rex = await prisma.animal.create({
    data: {
      ownerId: donneur1.id,
      originalOwnerId: donneur1.id,
      name: 'Rex',
      species: 'CHIEN',
      sex: 'MALE',
      size: 'GRAND',
      temperament: 'ACTIF',
      age: 36,
      description: 'Rex est un Beagle énergique qui adore courir et jouer en extérieur. Il a besoin d\'une maison avec jardin et d\'un propriétaire actif. Très loyal et affectueux avec sa famille.',
      vaccinated: true,
      spayed: false,
      dewormed: true,
      city: 'Tunis',
      status: 'DISPONIBLE',
      goodWithKids: true,
      goodWithPets: false,
      activityLevel: 'ELEVE',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.dogs[0], isPrimary: true },
          { url: PHOTOS.dogs[1], isPrimary: false },
        ],
      },
      healthRecords: {
        create: [
          {
            title: 'Bilan de santé',
            description: 'Excellent état de santé général',
            date: new Date('2024-09-10'),
            veterinarian: 'Dr. Sassi',
          },
        ],
      },
    },
  });

  // 6. Bella - Chienne DISPONIBLE (parfaite pour famille)
  const bella = await prisma.animal.create({
    data: {
      ownerId: donneur2.id,
      originalOwnerId: donneur2.id,
      name: 'Bella',
      species: 'CHIEN',
      sex: 'FEMELLE',
      size: 'MOYEN',
      temperament: 'CALME',
      age: 24,
      description: 'Bella est une chienne douce et patiente, parfaite pour les familles avec enfants. Elle est bien dressée et obéissante. Elle adore les promenades tranquilles.',
      vaccinated: true,
      spayed: true,
      dewormed: true,
      city: 'Sfax',
      status: 'DISPONIBLE',
      goodWithKids: true,
      goodWithPets: true,
      activityLevel: 'MOYEN',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.dogs[2], isPrimary: true },
          { url: PHOTOS.dogs[3], isPrimary: false },
        ],
      },
    },
  });

  // 7. Max - Chien DISPONIBLE (petit appartement ok)
  const max = await prisma.animal.create({
    data: {
      ownerId: donneur2.id,
      originalOwnerId: donneur2.id,
      name: 'Max',
      species: 'CHIEN',
      sex: 'MALE',
      size: 'PETIT',
      temperament: 'JOUEUR',
      age: 8,
      description: 'Max est un chiot plein de vie qui s\'adapte à tout type de logement. Il est en cours de dressage et apprend vite. Parfait pour une première adoption.',
      vaccinated: true,
      spayed: false,
      dewormed: true,
      city: 'Tunis',
      status: 'DISPONIBLE',
      goodWithKids: true,
      goodWithPets: true,
      activityLevel: 'ELEVE',
      publishedAt: new Date(),
      photos: {
        create: [
          { url: PHOTOS.dogs[4], isPrimary: true },
        ],
      },
    },
  });

  // 8. Rocky - Chien EN ATTENTE VALIDATION
  const rocky = await prisma.animal.create({
    data: {
      ownerId: donneur1.id,
      originalOwnerId: donneur1.id,
      name: 'Rocky',
      species: 'CHIEN',
      sex: 'MALE',
      size: 'GRAND',
      temperament: 'PROTECTEUR',
      age: 60,
      description: 'Rocky est un chien de garde loyal qui a besoin d\'un propriétaire expérimenté.',
      vaccinated: true,
      spayed: false,
      dewormed: true,
      city: 'Tunis',
      status: 'ATTENTE_VALIDATION',
      goodWithKids: false,
      goodWithPets: false,
      activityLevel: 'MOYEN',
      photos: {
        create: [
          { url: PHOTOS.dogs[0], isPrimary: true },
        ],
      },
    },
  });

  // ── AUTRES ──

  // 9. Coco - Lapin DISPONIBLE
  const coco = await prisma.animal.create({
    data: {
      ownerId: donneur2.id,
      originalOwnerId: donneur2.id,
      name: 'Coco',
      species: 'AUTRE',
      sex: 'FEMELLE',
      size: 'PETIT',
      temperament: 'CALME',
      age: 18,
      description: 'Coco est une lapine douce et curieuse. Elle adore explorer et grignoter des légumes frais. Très propre et facile à entretenir.',
      vaccinated: false,
      spayed: false,
      dewormed: true,
      city: 'Sfax',
      status: 'DISPONIBLE',
      goodWithKids: true,
      goodWithPets: false,
      activityLevel: 'FAIBLE',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      photos: {
        create: [
          { url: PHOTOS.others[0], isPrimary: true },
        ],
      },
    },
  });

  console.log('✅ 9 animaux créés\n');

  // ─────────────────────────────────────────
  // ADOPTIONS
  // ─────────────────────────────────────────
  console.log('📋 Création des adoptions...');

  // Adoption 1 : Milo EN_COURS_ADOPTION (adoptant1 → donneur1)
  const adoption1 = await prisma.adoptionRequest.create({
    data: {
      animalId: milo.id,
      adopterId: adoptant1.id,
      donneurId: donneur1.id,
      status: 'ACCEPTEE',
      message: 'Je cherche un compagnon pour mon appartement, Milo semble parfait !',
      decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Thread pour adoption1
  const thread1 = await prisma.thread.create({
    data: {
      adoptionId: adoption1.id,
      lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // Messages dans le thread
  await prisma.message.createMany({
    data: [
      {
        threadId: thread1.id,
        senderId: adoptant1.id,
        content: 'Bonjour ! Je suis très content que ma demande soit acceptée. Comment se passe le transfert ?',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        isRead: true,
      },
      {
        threadId: thread1.id,
        senderId: donneur1.id,
        content: 'Bonjour Bilel ! Je suis ravie de vous confier Milo. On peut se retrouver ce weekend pour vous le présenter.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isRead: true,
      },
      {
        threadId: thread1.id,
        senderId: adoptant1.id,
        content: 'Parfait ! Samedi après-midi me convient. À bientôt !',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: true,
      },
    ],
  });

  // Check-ins pour adoption1 (J+1, J+3, J+14, J+30)
  const now = new Date();
  const checkInDelays = [
    { days: 1, number: 1 },
    { days: 3, number: 2 },
    { days: 14, number: 3 },
    { days: 30, number: 4 },
  ];

  for (const delay of checkInDelays) {
    const scheduledFor = new Date(adoption1.decidedAt!);
    scheduledFor.setDate(scheduledFor.getDate() + delay.days);
    await prisma.checkIn.create({
      data: {
        adoptionId: adoption1.id,
        requestedById: donneur1.id,
        scheduledFor,
        dueDate: scheduledFor,
        checkInNumber: delay.number,
        message: `Check-in J+${delay.days} : comment va Milo ?`,
        status: delay.number === 1 ? 'COMPLETE' : 'EN_ATTENTE',
        respondedById: delay.number === 1 ? adoptant1.id : null,
        responseNote: delay.number === 1 ? 'Milo s\'adapte très bien ! Il a déjà trouvé ses coins préférés 😊' : null,
        wellbeingScore: delay.number === 1 ? 5 : null,
        respondedAt: delay.number === 1 ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) : null,
        photoUrl: delay.number === 1 ? PHOTOS.cats[2] : null,
      },
    });
  }

  // Adoption 2 : Simba COMPLETEE (leila → donneur1)
  const adoption2 = await prisma.adoptionRequest.create({
    data: {
      animalId: simba.id,
      adopterId: adoptant3.id,
      donneurId: donneur1.id,
      status: 'COMPLETEE',
      message: 'Je suis vétérinaire, je prendrai soin de Simba comme un roi.',
      decidedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Adoption 3 : Luna EN_ATTENTE (adoptant2 → donneur1)
  await prisma.adoptionRequest.create({
    data: {
      animalId: luna.id,
      adopterId: adoptant2.id,
      donneurId: donneur1.id,
      status: 'EN_ATTENTE',
      message: 'J\'ai une grande maison et beaucoup d\'amour à donner à Luna !',
    },
  });

  // Adoption 4 : Luna EN_ATTENTE (adoptant3 → donneur1)
  await prisma.adoptionRequest.create({
    data: {
      animalId: luna.id,
      adopterId: adoptant3.id,
      donneurId: donneur1.id,
      status: 'EN_ATTENTE',
      message: 'Luna me semble parfaite pour compléter ma maison.',
    },
  });

  // Adoption 5 : Bella EN_ATTENTE (adoptant2 → donneur2)
  await prisma.adoptionRequest.create({
    data: {
      animalId: bella.id,
      adopterId: adoptant2.id,
      donneurId: donneur2.id,
      status: 'EN_ATTENTE',
      message: 'Bella serait parfaite pour mes enfants. Nous avons une grande maison.',
    },
  });

  // Adoption 6 : Nala REFUSEE
  await prisma.adoptionRequest.create({
    data: {
      animalId: nala.id,
      adopterId: adoptant1.id,
      donneurId: donneur2.id,
      status: 'REFUSEE',
      message: 'Je voudrais adopter Nala.',
      decisionNote: 'Appartement trop petit pour Nala qui a besoin de calme et d\'espace.',
      decidedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ 6 demandes d\'adoption créées\n');

  // ─────────────────────────────────────────
  // SIGNALEMENTS
  // ─────────────────────────────────────────
  console.log('🚨 Création des signalements...');

  await prisma.sighting.createMany({
    data: [
      {
        reporterId: adoptant1.id,
        latitude: 36.8190,
        longitude: 10.1650,
        situation: 'BLESSE',
        description: 'Chat roux blessé à la patte avant droite, trouvé près du marché central. Il ne peut pas marcher correctement.',
        photoUrl: PHOTOS.cats[1],
        status: 'SIGNALE',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        reporterId: adoptant2.id,
        volunteerId: adoptant3.id,
        latitude: 36.8050,
        longitude: 10.1800,
        situation: 'EN_BONNE_SANTE',
        description: 'Chien errant dans le quartier depuis plusieurs jours. Semble en bonne santé mais cherche à manger.',
        photoUrl: PHOTOS.dogs[1],
        status: 'PRIS_EN_CHARGE',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        reporterId: adoptant3.id,
        latitude: 36.8300,
        longitude: 10.1550,
        situation: 'AVEC_PETITS',
        description: 'Chatte avec 4 chatons sous un escalier. Ils semblent avoir faim. La mère est craintive.',
        status: 'SIGNALE',
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        reporterId: donneur2.id,
        volunteerId: adoptant1.id,
        latitude: 36.7900,
        longitude: 10.1700,
        situation: 'BLESSE',
        description: 'Pigeon blessé avec une aile cassée trouvé sur le trottoir.',
        status: 'SECOURU',
        resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        reporterId: adoptant2.id,
        latitude: 34.7400,
        longitude: 10.7600,
        situation: 'INCONNU',
        description: 'Animal non identifié aperçu en bordure de route. Comportement craintif.',
        status: 'SIGNALE',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ],
  });

  // Badge sauveur pour adoptant1 (a secouru un animal)
  await prisma.userProfile.update({
    where: { userId: adoptant1.id },
    data: { saviorBadge: true, saviorCount: 1 },
  });

  // Badge completion pour leila (a terminé un parcours)
  await prisma.userProfile.update({
    where: { userId: adoptant3.id },
    data: { completionBadge: true },
  });

  console.log('✅ 5 signalements créés\n');

  // ─────────────────────────────────────────
  // RÉSUMÉ
  // ─────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('✅ SEED TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════\n');

  console.log('👤 UTILISATEURS (mot de passe : Test1234!) :');
  console.log('  admin@petbridge.com       → ADMIN');
  console.log('  donneur@petbridge.com     → DONNEUR (Sarra, Tunis)');
  console.log('  donneur2@petbridge.com    → DONNEUR (Mehdi, Sfax)');
  console.log('  adoptant@petbridge.com    → ADOPTANT (Bilel, Tunis) 🦸 Sauveur');
  console.log('  adoptant2@petbridge.com   → ADOPTANT (Amine, Sfax)');
  console.log('  adoptant3@petbridge.com   → ADOPTANT (Leila, Tunis) 🏆 Exemplaire\n');

  console.log('🐾 ANIMAUX :');
  console.log('  Luna      → CHAT  DISPONIBLE     (Tunis, Sarra)   2 demandes EN_ATTENTE');
  console.log('  Milo      → CHAT  EN_COURS        (Tunis, Sarra)   adopté par Bilel, 1/4 check-ins');
  console.log('  Nala      → CHAT  DISPONIBLE     (Sfax,  Mehdi)');
  console.log('  Simba     → CHAT  ADOPTE          (Tunis, Sarra)   parcours terminé');
  console.log('  Rex       → CHIEN DISPONIBLE     (Tunis, Sarra)');
  console.log('  Bella     → CHIEN DISPONIBLE     (Sfax,  Mehdi)   1 demande EN_ATTENTE');
  console.log('  Max       → CHIEN DISPONIBLE     (Tunis, Mehdi)');
  console.log('  Rocky     → CHIEN ATTENTE_VALID  (Tunis, Sarra)');
  console.log('  Coco      → AUTRE DISPONIBLE     (Sfax,  Mehdi)\n');

  console.log('🚨 SIGNALEMENTS :');
  console.log('  1 SIGNALE   - Chat blessé (Tunis centre)');
  console.log('  1 PRIS_EN_CHARGE - Chien errant (Leila intervient)');
  console.log('  1 SIGNALE   - Chatte avec petits');
  console.log('  1 SECOURU   - Pigeon (Bilel a secouru)');
  console.log('  1 SIGNALE   - Animal inconnu (Sfax)\n');

  console.log('📋 SCÉNARIOS DE TEST :');
  console.log('  → Connexion Bilel : voir Milo EN_COURS, timeline, 1 check-in à faire');
  console.log('  → Connexion Sarra : voir 2 demandes pour Luna, accepter/refuser');
  console.log('  → Connexion Amine : voir demande pour Bella EN_ATTENTE');
  console.log('  → Connexion Leila : badge exemplaire, signalement en cours');
  console.log('  → Matching : Bilel → CHAT PETIT score élevé');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });