import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnimalsModule } from './animals/animals.module';
import { AdoptionsModule } from './adoptions/adoptions.module';
import { ThreadsModule } from './threads/threads.module';
import { CheckInsModule } from './checkins/checkins.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AnimalsModule,
    AdoptionsModule,
    ThreadsModule,
    CheckInsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
