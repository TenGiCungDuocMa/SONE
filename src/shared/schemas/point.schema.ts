import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNumber, IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

export type PointDocument = Point & Document;

export enum PointType {
    REFERRAL = 'REFERRAL',
    TASK = 'TASK',
    BONUS = 'BONUS'
}

@Schema({ timestamps: true })
export class Point {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    @IsNumber()
    amount: number;

    @Prop({
        type: String,
        enum: PointType,
        required: true
    })
    type: PointType;

    @Prop()
    @IsString()
    description: string;

    @Prop({ type: Object })
    metadata: Record<string, any>;
}

export const PointSchema = SchemaFactory.createForClass(Point); 