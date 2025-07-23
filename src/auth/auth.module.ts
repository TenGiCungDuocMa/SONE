import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SharedModelModule } from '../shared/shared-model.module';
import { ReferralModule } from '../referral/referral.module';
import { JwtService } from '@nestjs/jwt';
import { ReferralService } from '../referral/referral.service';
import { PointService } from '../point/point.service';

@Module({
  imports: [SharedModelModule, ReferralModule],
  controllers: [AuthController],
  providers: [AuthService,JwtService,ReferralService,PointService],
})
export class AuthModule {}
