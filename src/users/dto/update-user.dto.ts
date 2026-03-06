import { IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: 'L\'email doit être valide' })
    email?: string;
}
