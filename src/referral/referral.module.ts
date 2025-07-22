import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { PointModule } from 'src/point/point.module';
import { SharedModelModule } from 'src/shared/shared-model.module';

@Module({
    imports: [
        SharedModelModule,
        PointModule
    ],
    controllers: [ReferralController],
    providers: [ReferralService],
    exports: [ReferralService]
})
export class ReferralModule { } 