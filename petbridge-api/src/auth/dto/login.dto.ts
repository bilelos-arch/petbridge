import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'L\'email doit être valide' })
    @IsNotEmpty({ message: 'L\'email est requis' })
    email: string;

    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    password: string;
}
