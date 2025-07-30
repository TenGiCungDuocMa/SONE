import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { Document } from "mongoose";

export enum KuroStatus {
    NONE = 0,
    OPEN = 1,
    DRAWING = 2,
    DRAWN = 3,
    CANCELLED = 4
}

@Schema({ timestamps: true })
export class Kuro extends Document {
    @Prop({ type: String, default: '0' })
    @IsString()
    roundId: string

    @Prop({ type: Number, enum: KuroStatus, default: KuroStatus.NONE })
    @IsNumber()
    startTime: number

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    endTime: number

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    drawnAt: number

    @Prop({ type: Number, default: '0' })
    @IsNumber()
    numberOfParticipants: number

    @Prop({ type: String, default: '0' })
    @IsString()
    winner: string

    @Prop({ type: String, default: '0' })
    @IsString()
    totalValue: string

    @Prop({ type: String, default: '0' })
    @IsString()
    totalEntries: string

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    status: number

    @Prop({ type: [{ address: String, deposits: [{ amount: String, tokenAddress: String }] }], default: [] })
    participants: { address: string, deposits: { amount: string, tokenAddress: string }[] }[]

    @Prop({ type: Boolean, default: false })
    @IsBoolean()
    winnerClaimed: boolean

    @Prop({ type: String, default: '0' })
    @IsString()
    txClaimed: string

    @Prop({ type: String, default: '' })
    @IsString()
    kuroContractAddress: string

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    version: number

    @Prop({ type: Number})
    protocolFeeOwed: number

    @Prop({ type: Boolean, default: false })
    prizesClaimed: boolean
}

export const KuroSchema = SchemaFactory.createForClass(Kuro);
