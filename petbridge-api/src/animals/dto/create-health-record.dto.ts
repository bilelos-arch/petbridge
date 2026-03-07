import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateHealthRecordDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsOptional()
  @IsString()
  veterinarian?: string;
}