import { Module } from "@nestjs/common";
import { SharedModelModule } from "src/shared/shared-model.module";
import { JackpotController } from "./jackpot.controller";
import { JackpotService } from "./jackpot.service";

@Module({
    imports: [SharedModelModule],
    controllers: [JackpotController],
    providers: [JackpotService],
    exports: [JackpotService]
  })

export class JackpotModule { }