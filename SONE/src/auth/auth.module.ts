import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SharedModelModule } from '../shared/shared-model.module';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../services/JwtAuthGuard';
@Module({
  imports: [SharedModelModule],
  controllers: [AuthController],
  providers: [AuthService,JwtAuthGuard, JwtService],
})
export class AuthModule {}
 