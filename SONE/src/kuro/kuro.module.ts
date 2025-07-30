import { Module } from '@nestjs/common';
import { KuroController } from './kuro.controller';
import { KuroService } from './kuro.service';
import { SharedModelModule } from 'src/shared/shared-model.module';
import { DepositTrackerService } from './deposit-tracker.service';
import { KuroSeedService } from './kuro.seed';

@Module({
  imports: [SharedModelModule],
  controllers: [KuroController],
  providers: [KuroService, DepositTrackerService, KuroSeedService],
  exports: [KuroService, DepositTrackerService, KuroSeedService]
})
export class KuroModule { }
