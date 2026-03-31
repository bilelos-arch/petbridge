import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnimalsModule } from './animals/animals.module';
import { AdoptionsModule } from './adoptions/adoptions.module';
import { ThreadsModule } from './threads/threads.module';
import { CheckInsModule } from './checkins/checkins.module';
import { ReportsModule } from './reports/reports.module';
import { BreedsModule } from './breeds/breeds.module';
import { MatchingModule } from './matching/matching.module';
import { SightingsModule } from './sightings/sightings.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AnimalsModule,
    AdoptionsModule,
    ThreadsModule,
    CheckInsModule,
    ReportsModule,
    BreedsModule,
    MatchingModule,
    SightingsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
