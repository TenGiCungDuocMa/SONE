import { Module } from '@nestjs/common';
import { PointService } from './point.service';
import { SharedModelModule } from 'src/shared/shared-model.module';
import { PointController } from './point.controller';

@Module({
    imports: [
        SharedModelModule
    ],
    controllers:[PointController],
    providers: [PointService],
    exports: [PointService]
})
export class PointModule { } 