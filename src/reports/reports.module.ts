import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnimalsModule } from '../animals/animals.module';
import { ThreadsModule } from '../threads/threads.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, AnimalsModule, ThreadsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}