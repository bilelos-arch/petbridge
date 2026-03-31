import { Module } from '@nestjs/common';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  controllers: [AnimalsController],
  providers: [AnimalsService],
})
export class AnimalsModule {}