import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

export enum DiddyStatus {
    NONE = 0,
    OPEN = 1,
    DRAWING = 2,
    DRAWN = 3,
    CANCELLED = 4
}

@Schema({ timestamps: true })
export class Diddy extends Document {
    @Prop({ type: String, default: '0' })
    @IsString()
    roundId: string;

    @Prop({ type: Number, enum: DiddyStatus, default: DiddyStatus.NONE })
    @IsNumber()
    status: number;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    startTime: number;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    endTime: number;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    drawnAt: number;

    @Prop({ type: String, default: '0' })
    @IsString()
    numberOfPlayers: string;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    safeRoom: number;

    @Prop({ type: String, default: '0' })
    @IsString()
    totalValue: string;

    @Prop({ type: String, default: '0' })
    @IsString()
    totalEntries: string;

    @Prop({ type: String, default: '0' })
    @IsString()
    protocolFeeOwed: string;

    @Prop({
        type: [{
            address: String,
            deposit: String,
            claimed: Boolean,
            txHash: String,
            claimedAt: Number
        }], default: []
    })
    winners: {
        address: string,
        deposit: string,
        claimed: boolean,
        txHash: string,
        claimedAt: number
    }[];

    @Prop({ type: [{ address: String, deposit: String, roomNumber: Number }], default: [] })
    participants: { address: string, deposit: string, roomNumber: number }[];

    @Prop({ type: Boolean, default: false })
    allWinnersClaimed: boolean;

    @Prop({ type: String, default: '0' })
    carryOverReward: string;
}

export const DiddySchema = SchemaFactory.createForClass(Diddy); 