import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Player extends Document {
    @Prop({ required: true })
    address: string;

    @Prop({ default: "0" })
    totalDeposits: string;

    @Prop({ default: 0 })
    entries: number;

    @Prop({ default: 0 })
    winrate: number;

    @Prop({ default: 0 })
    lastUpdateTime: number;
}

export type RoundStatus = "None" | "Open" | "Drawing" | "Drawn" | "Cancelled";
@Schema({ timestamps: true })
export class Round extends Document {
    @Prop({ required: true, unique: true })
    @IsNumber()
    roundId: number;

    @Prop({ required: true, enum: ["None", "Open", "Drawing", "Drawn", "Cancelled"], default: "None", type: String })
    status: RoundStatus;

    @Prop()
    @IsNumber()
    cutoffTime?: number;

    @Prop({ default: "0" })
    @IsString()
    totalPool: string;

    @Prop({ default: 0 })
    @IsNumber()
    numberOfParticipants: number;

    @Prop()
    @IsString()
    winner?: string;

    @Prop()
    @IsDate()
    completedAt?: Date;

    @Prop()
    @IsDate()
    updatedAt?: Date;

    @Prop()
    players?: Player[];
}

export const RoundSchema = SchemaFactory.createForClass(Round); 