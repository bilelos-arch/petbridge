import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    IsBoolean,
    IsArray,
    ValidateIf
} from 'class-validator';
import { HousingType } from '@prisma/client';

export class UpdateProfileDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    city: string;

    @IsEnum(HousingType)
    housingType: HousingType;

    @IsOptional()
    @IsInt()
    surfaceArea?: number;

    @IsBoolean()
    hasGarden: boolean;

    @IsBoolean()
    hasChildren: boolean;

    @IsArray()
    @IsInt({ each: true })
    childrenAges: number[];

    @IsBoolean()
    hasOtherPets: boolean;

    @ValidateIf(o => o.hasOtherPets === true)
    @IsString()
    otherPetsDesc?: string;

    @IsInt()
    hoursAbsent: number;

    @IsBoolean()
    hasPetExperience: boolean;

    @ValidateIf(o => o.hasPetExperience === true)
    @IsString()
    petExpDesc?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
