import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsNumber, IsString, IsDate } from "class-validator";
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    unique: true,
    validate: {
      validator: (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value),
    },
  })
  address: string;

  @Prop({ type: Number, default: () => Math.floor(Math.random() * 1000000) })
  nonce: number;

  @Prop({ default: "" })
  @IsString()
  displayName: string;

  @Prop({ default: "" })
  @IsEmail()
  email: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  @IsNumber()
  points: number;

  @Prop({ default: 0 })
  @IsNumber()
  totalPoints: number;

  @Prop()
  @IsDate()
  createdAt: Date;

  @Prop()
  @IsDate()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
