import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class GetAllPoolsDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: 'The limit of the pools' })
  limit: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: 'The page number' })
  page: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter pools by winner address', required: false })
  address?: string;
}
