import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsDate, IsNumber, IsString } from "class-validator";

export enum EventType {
  REFERRAL = "REFERRAL",
  FISHING = "FISHING",
  CHEST = "CHEST",
  QUEST = "QUEST",
  POOL_DEPOSIT = "POOL_DEPOSIT",
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  @IsString()
  user: string; // address user

  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ default: 0 })
  @IsNumber()
  points: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ default: null })
  @IsString()
  transactionHash?: string;

  @Prop({ default: null })
  @IsString()
  transactionId?: string;

  @Prop()
  @IsDate()
  createdAt: Date;

  @Prop()
  @IsDate()
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
