import 'reflect-metadata';
import 'dotenv/config';
import { json } from 'express';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { VerificationsController } from './verifications.controller';
import { RoutesController } from './routes.controller';
import { DiscoverController } from './discover.controller';
import { CommunitiesController } from './communities.controller';
import { SafetyController } from './safety.controller';
import { RatingsController } from './ratings.controller';
import { DmController } from './dm.controller';
import { CarpoolController, ShareController } from './carpool.controller';
import { OfficeController } from './office.controller';
import { PersonalController } from './personal.controller';
import { GamifikasiController } from './gamifikasi.controller';
import { VehiclesController } from './vehicles.controller';

@Controller()
class AppController {
  @Get('/health')
  health() {
    return { ok: true, service: 'searah-api' };
  }
}

@Module({ controllers: [AppController, AuthController, VerificationsController, RoutesController, DiscoverController, CommunitiesController, SafetyController, RatingsController, DmController, CarpoolController, ShareController, OfficeController, PersonalController, GamifikasiController, VehiclesController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(json({ limit: '10mb' }));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
