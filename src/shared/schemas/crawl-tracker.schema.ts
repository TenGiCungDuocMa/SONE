import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CrawlTracker extends Document {
  @Prop({ required: true, unique: true })
  @IsString()
  subgraphName: string;

  @Prop({ required: true, default: '0' })
  @IsString()
  lastTimestamp: string;

  @Prop()
  @IsDate()
  lastProcessedAt: Date;

  @Prop({ default: false })
  @IsBoolean()
  isProcessing: boolean;

  @Prop({ default: 0 })
  @IsNumber()
  totalProcessed: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const CrawlTrackerSchema = SchemaFactory.createForClass(CrawlTracker); 