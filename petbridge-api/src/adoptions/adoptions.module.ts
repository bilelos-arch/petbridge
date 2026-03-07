import { Module } from '@nestjs/common';
import { AdoptionsController } from './adoptions.controller';
import { AdoptionsService } from './adoptions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdoptionsController],
  providers: [AdoptionsService]
})
export class AdoptionsModule {}
