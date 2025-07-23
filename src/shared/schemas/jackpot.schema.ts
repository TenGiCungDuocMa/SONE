import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose";
import { IsIn, IsString } from 'class-validator';

@Schema({ timestamps: true })
export class JackpotContribution extends Document {
    @Prop({ required: true })
    jackpotId: number;

    @Prop({ required: true })
    roundId: string;

    @Prop({ required: true })
    jackpotFee: string;

    @Prop({ required: true })
    contributor: string;
}

export enum JackpotStatus {
    Processing = 'Processing',
    Ended = 'Ended',
}

@Schema({ timestamps: true })
export class Jackpot extends Document {
    @Prop({ required: true, unique: true })
    jackpotId: number;

    @Prop({ default: "" })
    roundId: string;

    @Prop({default: ""})
    winner: string;

    @Prop({ default: "0" })
    totalPool: string;

    @Prop({default: ""})
    txTransferred: string;

    @Prop({ type: String, enum: Object.values(JackpotStatus), default: JackpotStatus.Processing })
    @IsString()
    @IsIn(Object.values(JackpotStatus), { message: 'Status phải là Processing hoặc Ended' })
    status: JackpotStatus;

    @Prop({ default: 0 })
    endTime: number;
}

export const JackpotFeeSchema = SchemaFactory.createForClass(JackpotContribution);
export const JackpotSchema = SchemaFactory.createForClass(Jackpot);