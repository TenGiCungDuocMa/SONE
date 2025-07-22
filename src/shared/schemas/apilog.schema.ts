import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { Document } from "mongoose";

export enum RequestStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

@Schema({ timestamps: true })
export class ApiLog extends Document {
  @Prop({ required: true })
  @IsString()
  path: string; // Endpoint được gọi

  @Prop({ required: true })
  @IsString()
  method: string; // HTTP method (GET, POST, PUT, DELETE)

  @Prop({ type: Object, default: null })
  body: Record<string, any>; // Nội dung body

  @Prop({ type: Object, default: null })
  headers: Record<string, any>; // Headers của request

  @Prop({ type: Object, default: null })
  response?: Record<string, any>; // Nội dung response (nếu cần)

  @Prop({ required: true })
  @IsNumber()
  statusCode: number; // HTTP status code

  @Prop({ required: true })
  @IsString()
  ip: string; // IP của client

  @Prop({ required: true })
  @IsString()
  userAgent: string; // Thông tin trình duyệt hoặc client

  @Prop({ required: true })
  @IsNumber()
  latency: number; // Thời gian xử lý request (ms)

  @Prop({ default: false })
  @IsBoolean()
  suspicious: boolean; // Đánh dấu nếu yêu cầu đáng ngờ

  @Prop({ type: Object, default: null })
  token?: Record<string, any>; // Decoded JWT token payload

  @Prop({ default: null })
  @IsString()
  errorMessage?: string; // Lỗi nếu có
}

export const ApiLogSchema = SchemaFactory.createForClass(ApiLog);
