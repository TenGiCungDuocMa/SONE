import { IsEthereumAddress, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifySignatureDto {
    @ApiProperty({
        description: 'Ethereum wallet address',
        example: '0x1234567890abcdef1234567890abcdef12345678'
    })
    @IsEthereumAddress()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        description: 'Signed message',
        example: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456'
    })
    @IsString()
    @IsNotEmpty()
    signature: string;

} 