import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrawWinnerKeeperService } from "./draw-winner-keeper.service";
@Module({
  imports: [ConfigModule],
  providers: [DrawWinnerKeeperService],
  exports: [DrawWinnerKeeperService]
})
export class KeeperModule {}