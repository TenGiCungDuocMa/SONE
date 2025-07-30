import { Module } from '@nestjs/common';
import { PointService } from './point.service';
import { SharedModelModule } from 'src/shared/shared-model.module';

@Module({
    imports: [
        SharedModelModule
    ],
    providers: [PointService],
    exports: [PointService]
})
export class PointModule { } 