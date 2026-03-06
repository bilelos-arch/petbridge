import { IsString, MinLength } from 'class-validator';

export class RejectAdoptionDto {
  @IsString()
  @MinLength(10)
  decisionNote: string;
}