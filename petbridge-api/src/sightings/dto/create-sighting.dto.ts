import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AnimalSituation } from '@prisma/client';

export class CreateSightingDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsEnum(AnimalSituation)
  @IsOptional()
  situation?: AnimalSituation;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}