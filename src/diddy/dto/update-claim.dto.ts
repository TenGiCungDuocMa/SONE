import { ApiProperty } from '@nestjs/swagger';

export class UpdateClaimDto {
    @ApiProperty({ description: 'Transaction hash of the claim' })
    txHash: string;
} 