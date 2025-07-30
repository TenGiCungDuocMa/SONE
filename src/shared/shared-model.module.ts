import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  TokenBlocklist,
  TokenBlocklistSchema,
} from "./schemas/token-blocklist.schema";
import { User, UserSchema } from "src/auth/schemas/user.schema";
import { Pool, PoolSchema } from "./schemas/pool.schema";
import { Kuro, KuroSchema } from "./schemas/kuro.schema";
import { Point } from "./schemas/point.schema";
import { PointSchema } from "./schemas/point.schema";
import { Round, RoundSchema } from "./schemas/round.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Round.name, schema: RoundSchema },
      { name: Pool.name, schema: PoolSchema },
      { name: Kuro.name, schema: KuroSchema },
      { name: Point.name, schema: PointSchema },
      {name:TokenBlocklist.name, schema: TokenBlocklistSchema},
    ]),
  ],
  providers: [],
  exports: [
    MongooseModule
  ],
})
export class SharedModelModule { }
