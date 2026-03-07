import { IsEnum, IsOptional } from 'class-validator';
import { ReportCible } from './create-report.dto';
import { ReportStatus } from './update-report-status.dto';

export class ReportFiltersDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportCible)
  cible?: ReportCible;
}