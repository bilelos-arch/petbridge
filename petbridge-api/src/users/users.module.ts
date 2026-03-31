import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../animals/cloudinary/cloudinary.module';
import { CloudinaryService } from '../animals/cloudinary/cloudinary.service';
import { MatchingModule } from '../matching/matching.module';

@Module({
    imports: [PrismaModule, CloudinaryModule, MatchingModule],
    controllers: [UsersController],
    providers: [UsersService, CloudinaryService],
    exports: [UsersService],
})
export class UsersModule { }
