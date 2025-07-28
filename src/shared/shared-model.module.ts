import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiLog, ApiLogSchema } from "./schemas/apilog.schema";

import {
  TokenBlocklist,
  TokenBlocklistSchema,
} from "./schemas/token-blocklist.schema";
import { User, UserSchema } from "src/auth/schemas/user.schema";
import { CrawlTracker, CrawlTrackerSchema } from "./schemas/crawl-tracker.schema";
import { Pool, PoolSchema } from "./schemas/pool.schema";
import { Kuro, KuroSchema } from "./schemas/kuro.schema";
import { Referral, ReferralSchema } from "./schemas/referral.schema";
import { Point } from "./schemas/point.schema";
import { PointSchema } from "./schemas/point.schema";
import { DiddySchema } from "./schemas/diddy.schema";
import { Diddy } from "./schemas/diddy.schema";
import { Jackpot, JackpotContribution, JackpotFeeSchema, JackpotSchema } from "./schemas/jackpot.schema";
import { EventSchema } from "./schemas/event.schema";
import { Round, RoundSchema } from "./schemas/round.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiLog.name, schema: ApiLogSchema },
      { name: User.name, schema: UserSchema },
      { name: TokenBlocklist.name, schema: TokenBlocklistSchema },
      { name: Event.name, schema: EventSchema },
      { name: Round.name, schema: RoundSchema },
      { name: CrawlTracker.name, schema: CrawlTrackerSchema },
      { name: Pool.name, schema: PoolSchema },
      { name: Kuro.name, schema: KuroSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Point.name, schema: PointSchema },
      { name: Diddy.name, schema: DiddySchema },
      { name: JackpotContribution.name, schema: JackpotFeeSchema },
      { name: Jackpot.name, schema: JackpotSchema },
    ]),
  ],
  providers: [],
  exports: [
    MongooseModule
  ],
})
export class SharedModelModule { }
