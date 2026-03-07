import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReportCible {
  UTILISATEUR = 'UTILISATEUR',
  ANIMAL = 'ANIMAL',
  MESSAGE = 'MESSAGE',
}

export class CreateReportDto {
  @IsEnum(ReportCible)
  @IsNotEmpty()
  cible: ReportCible;

  @IsOptional()
  @IsString()
  cibleUserId?: string;

  @IsOptional()
  @IsString()
  cibleAnimalId?: string;

  @IsOptional()
  @IsString()
  cibleMessageId?: string;

  @IsNotEmpty()
  @IsString()
  raison: string;
}