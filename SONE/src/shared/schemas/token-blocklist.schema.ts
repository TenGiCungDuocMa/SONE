import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsDate, IsString } from "class-validator";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class TokenBlocklist extends Document {
  @Prop({ required: true })
  @IsString()
  token: string;

  @Prop({ required: true })
  @IsDate()
  expiresAt: Date;
}

export const TokenBlocklistSchema = SchemaFactory.createForClass(TokenBlocklist);
