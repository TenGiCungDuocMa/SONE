import { Module } from '@nestjs/common';
import { KuroService } from './kuro.service';
import { KuroController } from './kuro.controller';

@Module({
  controllers: [KuroController],
  providers: [KuroService],
})
export class KuroModule {}
