import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrawWinnerKeeperService } from './draw-winner-keeper.service';
import { DrawWinnerHideKeeperService } from './draw-winner-hide-keeper.service';

@Module({
    imports: [ConfigModule],
    providers: [DrawWinnerKeeperService, DrawWinnerHideKeeperService],
    exports: [DrawWinnerKeeperService, DrawWinnerHideKeeperService]
})
export class KeeperModule {} 