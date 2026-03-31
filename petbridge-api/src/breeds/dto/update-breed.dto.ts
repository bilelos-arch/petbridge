import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Species } from '@prisma/client';

export class UpdateBreedDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}