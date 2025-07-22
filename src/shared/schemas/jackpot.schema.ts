import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { IsNumber, IsString } from "class-validator";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class JackpotContribution extends Document {
    @Prop({ required: true })
    @IsNumber()
    jackpotId: number;

    @Prop({ required: true })
    @IsString()
    roundId: string;

    @Prop({ required: true })
    @IsString()
    jackpotFee: string;

    @Prop({ required: true })
    @IsString()
    contributor: string;
}

export type JackpotStatus = "Processing" | "Ended";

@Schema({ timestamps: true })
export class Jackpot extends Document {
    @Prop({ required: true, unique: true })
    @IsNumber()
    jackpotId: number;

    @Prop({ default: "" })
    @IsString()
    roundId: string;

    @Prop({default: ""})
    @IsString()
    winner: string;

    @Prop({ default: "0" })
    @IsString()
    totalPool: string;

    @Prop({default: ""})
    @IsString()
    txTransferred: string;

    @Prop({ enum: ["Processing", "Ended"], default: "Processing" })
    status: JackpotStatus;

    @Prop({ default: 0 })
    @IsNumber()
    endTime: number;
}

export const JackpotFeeSchema = SchemaFactory.createForClass(JackpotContribution);
export const JackpotSchema = SchemaFactory.createForClass(Jackpot);