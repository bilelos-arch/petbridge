import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateAdoptionDto {
  @IsUUID()
  animalId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}