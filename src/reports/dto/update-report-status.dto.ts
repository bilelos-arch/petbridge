import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReportStatus {
  OUVERT = 'OUVERT',
  EN_COURS = 'EN_COURS',
  RESOLU = 'RESOLU',
  REJETE = 'REJETE',
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}