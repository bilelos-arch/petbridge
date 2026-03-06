import { IsString, IsNotEmpty } from 'class-validator';

export class RejectAnimalDto {
  @IsNotEmpty()
  @IsString()
  rejectedReason: string;
}