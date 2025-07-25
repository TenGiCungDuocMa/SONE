import { ApiProperty } from '@nestjs/swagger';

export class GetAllPoolsDto {
    @ApiProperty({ description: 'Page number', required: false, default: 1 })
    page: number;

    @ApiProperty({ description: 'Items per page', required: false, default: 10 })
    limit: number;

    @ApiProperty({ description: 'Address to filter', required: false })
    address?: string;
} 