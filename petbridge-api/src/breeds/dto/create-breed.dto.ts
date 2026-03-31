import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Species } from '@prisma/client';

export class CreateBreedDto {
  @IsString()
  name: string;

  @IsEnum(Species)
  species: Species;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}