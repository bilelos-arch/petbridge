import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Species, Sex, Size, Status, Temperament } from '@prisma/client';

export class UpdateAnimalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsEnum(Size)
  size?: Size;

  @IsOptional()
  @IsEnum(Temperament)
  temperament?: Temperament;

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

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}