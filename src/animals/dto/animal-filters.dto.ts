import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Species, Sex, Size, Status, Temperament } from '@prisma/client';

export class AnimalFiltersDto {
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
  @IsEnum(Status)
  status?: Status;

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
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsString()
  search?: string;
}