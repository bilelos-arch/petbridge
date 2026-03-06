-- CreateEnum
CREATE TYPE "Species" AS ENUM ('CHIEN', 'CHAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMELLE');

-- CreateEnum
CREATE TYPE "Size" AS ENUM ('PETIT', 'MOYEN', 'GRAND');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ATTENTE_VALIDATION', 'DISPONIBLE', 'ADOPTE', 'REJETE');

-- CreateEnum
CREATE TYPE "Temperament" AS ENUM ('CALME', 'ACTIF', 'TIMIDE', 'PLAYFUL', 'PROTECTEUR');

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "sex" "Sex" NOT NULL,
    "size" "Size" NOT NULL,
    "temperament" "Temperament" NOT NULL,
    "age" INTEGER,
    "description" TEXT,
    "vaccinated" BOOLEAN NOT NULL DEFAULT false,
    "spayed" BOOLEAN NOT NULL DEFAULT false,
    "dewormed" BOOLEAN NOT NULL DEFAULT false,
    "breed" TEXT,
    "color" TEXT,
    "birthDate" TIMESTAMP(3),
    "medicalConditions" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ATTENTE_VALIDATION',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rejectedReason" TEXT,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalPhoto" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "veterinarian" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdoptionRequest" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "adopterId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ATTENTE_VALIDATION',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalPhoto" ADD CONSTRAINT "AnimalPhoto_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_adopterId_fkey" FOREIGN KEY ("adopterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
