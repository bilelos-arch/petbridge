import { Module } from '@nestjs/common';
import { SightingsController } from './sightings.controller';
import { SightingsService } from './sightings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../animals/cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  controllers: [SightingsController],
  providers: [SightingsService],
})
export class SightingsModule {}