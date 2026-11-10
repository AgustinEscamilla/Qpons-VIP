import { BadRequestException, Body, Controller, Get, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from './current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthenticatedUser, LoginInput, RegisterInput, ResendRegistrationCodeInput, UpdateProfileInput, VerifyRegistrationInput } from './auth.types.js';
import { MediaStorageService } from '../storage/media-storage.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  @Post('register')
  register(@Body() input: RegisterInput) {
    return this.authService.register(input);
  }

  @Post('verify-registration')
  verifyRegistration(@Body() input: VerifyRegistrationInput) {
    return this.authService.verifyRegistration(input);
  }

  @Post('resend-registration-code')
  resendRegistrationCode(@Body() input: ResendRegistrationCodeInput) {
    return this.authService.resendRegistrationCode(input);
  }

  @Post('login')
  login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() input: UpdateProfileInput) {
    return this.authService.updateProfile(user, input);
  }

  @Post('profile/photo')
  @UseGuards(JwtAuthGuard)
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
  async uploadProfilePhoto(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecciona una imagen de perfil');
    const imageUrl = await this.mediaStorage.saveImage(file, `profiles/${user.id}`);
    return this.authService.updateProfilePhoto(user, imageUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() request: { user: unknown }) {
    return request.user;
  }
}
