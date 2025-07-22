import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateReferralDto {
    @IsString()
    @IsNotEmpty()
    referralCode: string;
}

export class GetReferralsQueryDto {
    @IsNumber()
    @Min(1)
    @IsOptional()
    @ApiProperty({ default: 1 })
    page?: number = 1;

    @IsNumber()
    @Min(1)
    @Max(100)
    @IsOptional()
    @ApiProperty({ default: 10 })
    limit?: number = 10;
} 