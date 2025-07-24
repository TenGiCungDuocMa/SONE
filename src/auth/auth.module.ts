import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SharedModelModule } from '../shared/shared-model.module';
import { ReferralModule } from '../referral/referral.module';
import { JwtService } from '@nestjs/jwt';
import { ReferralService } from '../referral/referral.service';
import { PointService } from '../point/point.service';
import { JwtAuthGuard } from '../services/JwtAuthGuard';
import { TestService } from './test.service';
@Module({
  imports: [SharedModelModule, ReferralModule],
  controllers: [AuthController],
  providers: [AuthService,ReferralService,PointService,JwtAuthGuard, JwtService, TestService],
})
export class AuthModule {}
 