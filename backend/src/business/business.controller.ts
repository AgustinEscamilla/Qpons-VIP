import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '../database/entities/index.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { BusinessService } from './business.service.js';
import { MediaStorageService } from '../storage/media-storage.service.js';
import type { CreateCompanyInput, CreateCouponInput, CreateServiceHourInput, CreateStoreInput, SavePublicProfileLayoutInput, SaveWeeklyScheduleInput, UpdateCompanyApprovalInput, UpdateCouponInput, UpdateStoreInput } from './business.types.js';

// Punto de entrada protegido para el futuro panel privado de negocios.
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS, UserRole.ADMIN)
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      scope: 'business',
      message: 'Acceso autorizado al espacio del negocio',
      user,
    };
  }

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.businessService.overview(user);
  }

  @Post('company')
  createCompany(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateCompanyInput) {
    return this.businessService.createCompany(user, input);
  }

  @Patch('company')
  updateCompany(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateCompanyInput) {
    return this.businessService.updateCompany(user, input);
  }

  @Patch('company/public-profile-layout')
  savePublicProfileLayout(@CurrentUser() user: AuthenticatedUser, @Body() input: SavePublicProfileLayoutInput) {
    return this.businessService.savePublicProfileLayout(user, input);
  }

  @Get('companies/pending')
  @Roles(UserRole.ADMIN)
  pendingCompanies() {
    return this.businessService.pendingCompanies();
  }

  @Patch('companies/:companyId/approval')
  @Roles(UserRole.ADMIN)
  updateCompanyApproval(@Param('companyId', ParseIntPipe) companyId: number, @Body() input: UpdateCompanyApprovalInput) {
    return this.businessService.updateCompanyApproval(companyId, input);
  }

  @Post('stores')
  createStore(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateStoreInput) {
    return this.businessService.createStore(user, input);
  }

  @Patch('stores/:storeId')
  updateStore(@CurrentUser() user: AuthenticatedUser, @Param('storeId', ParseIntPipe) storeId: number, @Body() input: UpdateStoreInput) {
    return this.businessService.updateStore(user, storeId, input);
  }

  @Post('service-hours')
  createServiceHour(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateServiceHourInput) {
    return this.businessService.createServiceHour(user, input);
  }

  @Post('service-hours/weekly')
  saveWeeklySchedule(@CurrentUser() user: AuthenticatedUser, @Body() input: SaveWeeklyScheduleInput) {
    return this.businessService.saveWeeklySchedule(user, input);
  }

  @Post('coupons')
  createCoupon(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateCouponInput) {
    return this.businessService.createCoupon(user, input);
  }

  @Patch('coupons/:couponId')
  updateCoupon(@CurrentUser() user: AuthenticatedUser, @Param('couponId', ParseIntPipe) couponId: number, @Body() input: UpdateCouponInput) {
    return this.businessService.updateCoupon(user, couponId, input);
  }

  @Post('coupons/image')
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];
      if (!allowedImageTypes.includes(file.mimetype.toLowerCase())) {
        callback(new BadRequestException('Usa una imagen JPG, PNG, WEBP, HEIC o AVIF'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async uploadCouponImage(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecciona una imagen de cupón');
    const imageUrl = await this.mediaStorage.saveImage(file, 'coupons');
    return this.businessService.uploadCouponImage(user, imageUrl);
  }
}
