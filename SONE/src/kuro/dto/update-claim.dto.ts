import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateClaimDto {
  @ApiProperty({
    description: 'Transaction hash của việc claim',
    example: '0x1234567890abcdef...'
  })
  @IsNotEmpty()
  @IsString()
  txHash: string;
}