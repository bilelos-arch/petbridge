import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AdoptionStatus } from '@prisma/client';

export class AdoptionFiltersDto {
  @IsOptional()
  @IsEnum(AdoptionStatus)
  status?: AdoptionStatus;

  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsOptional()
  @IsUUID()
  adopterId?: string;
}