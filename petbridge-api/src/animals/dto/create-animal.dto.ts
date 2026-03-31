import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';
import { Species, Sex, Size, AnimalStatus, Temperament, ActivityLevel } from '@prisma/client';

export class CreateAnimalDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(Species)
  species: Species;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNotEmpty()
  @IsEnum(Sex)
  sex: Sex;

  @IsNotEmpty()
  @IsEnum(Size)
  size: Size;

  @IsNotEmpty()
  @IsEnum(Temperament)
  temperament: Temperament;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  vaccinated?: boolean;

  @IsOptional()
  @IsBoolean()
  spayed?: boolean;

  @IsOptional()
  @IsBoolean()
  dewormed?: boolean;

  @IsOptional()
  @IsString()
  breedId?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsBoolean()
  goodWithKids?: boolean;

  @IsOptional()
  @IsBoolean()
  goodWithPets?: boolean;

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;
}