import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert, City, Company, Coupon, ServiceHour, Store, User } from '../database/entities/index.js';
import { BusinessController } from './business.controller.js';
import { BusinessService } from './business.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Alert, City, Company, Coupon, ServiceHour, Store, User])],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
