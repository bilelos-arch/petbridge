import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';
import { Species, Sex, Size, Status, Temperament } from '@prisma/client';

export class CreateAnimalDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(Species)
  species: Species;

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
  breed?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  medicalConditions?: string;
}