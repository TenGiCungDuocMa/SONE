import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsNumber, IsString } from "class-validator";

export enum PoolStatus {
    COMING = "COMING",
    ACTIVE = "ACTIVE",
    WINNER_DRAWN = "WINNER_DRAWN",
    COMPLETED = "COMPLETED",
}

@Schema({ timestamps: true })
export class Pool {
    @Prop({ type: String, unique: true })
    @IsString()
    poolAddress: string;

    @Prop({ type: String })
    @IsString()
    depositDeadline: string;

    @Prop({ type: String })
    @IsString()
    drawTime: string;

    @Prop({ type: String })
    @IsString()
    duration: string;

    @Prop({ type: String })
    @IsString()
    name: string;

    @Prop({ type: String, default: PoolStatus.COMING })
    @IsString()
    status: string;

    @Prop({ type: String })
    @IsString()
    symbol: string;

    @Prop({ type: String })
    @IsString()
    totalDeposits: string;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    totalParticipants: number;

    @Prop({ type: String })
    @IsString()
    winner: string;

    @Prop({ type: String })
    @IsString()
    yieldProtocolAddress: string;

    @Prop({ type: String })
    @IsString()
    tokenAddress: string;

    @Prop({ type: String, default: 0 })
    @IsString()
    totalPlayers: string;

    @Prop({ type: String })
    @IsString()
    totalInterest: string;
}

export const PoolSchema = SchemaFactory.createForClass(Pool);


