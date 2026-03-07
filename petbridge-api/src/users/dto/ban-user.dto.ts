import { IsString, MinLength } from 'class-validator';

export class BanUserDto {
  @IsString()
  @MinLength(3, { message: 'La raison du bannissement doit contenir au moins 3 caractères' })
  reason: string;
}