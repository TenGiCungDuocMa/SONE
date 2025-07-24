import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean, IsDate, IsNumber } from 'class-validator';
import { Document, Types } from 'mongoose';

export type ReferralDocument = Referral & Document;

@Schema({ timestamps: true })
export class Referral {

    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    referrer: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    referred: Types.ObjectId;

    @Prop({ default: false })
    @IsBoolean()
    isCompleted: boolean;

    @Prop()
    @IsDate()
    completedAt?: Date;

    @Prop({ default: 0 })
    @IsNumber()
    rewardAmount: number;

    @Prop({ default: false })
    @IsBoolean()
    rewardClaimed: boolean;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral); 