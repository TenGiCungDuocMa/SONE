import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { BaseResponse } from 'src/response/BaseResponse';
import { BaseResponsePage } from 'src/response/BaseResponsePage';
import { DiddyService } from './diddy.service';
import { GetAllPoolsDto } from './dto/get-all-pools.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { JwtAuthGuard } from 'src/services/JwtAuthGuard';

@Controller('diddy')
export class DiddyController {
    constructor(private readonly diddyService: DiddyService) { }

    @Get('/current-pool')
    @ApiOperation({ summary: 'Get current pool' })
    @ApiResponse({ status: 200, description: 'Current pool' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async getPool() {
        const res = await this.diddyService.fetchPoolDiddy();
        return BaseResponse.success(res);
    }

    @Get('/:roundId')
    @ApiOperation({ summary: 'Get pool by roundId' })
    @ApiResponse({ status: 200, description: 'Pool by roundId' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async getPoolByRoundId(@Param('roundId') roundId: string) {
        const res = await this.diddyService.fetchPoolDiddyByRoundId(roundId);
        return BaseResponse.success(res);
    }

    @Get('/history/:address')
    @ApiOperation({ summary: 'Get user history' })
    @ApiResponse({ status: 200, description: 'User history' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async getHistory(@Param('address') address: string) {
        const res = await this.diddyService.getHistory(address);
        return BaseResponse.success(res);
    }

    @Post()
    @ApiOperation({ summary: 'Get all pools' })
    @ApiResponse({ status: 200, description: 'All pools' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async getAllPools(@Body() body: GetAllPoolsDto) {
        const { page, limit, address } = body;
        const { data, total } = await this.diddyService.fetchAllPools(page, limit, address);
        return BaseResponsePage.success(
            data,
            page,
            limit,
            total,
            'Pools fetched successfully'
        );
    }

    @Put('/:roundId/claim')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update winner claimed status' })
    @ApiResponse({ status: 200, description: 'Winner claimed status updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateWinnerClaimed(
        @Param('roundId') roundId: string,
        @Body() body: UpdateClaimDto,
        @Req() req: any
    ) {
        const user = req.user;
        const result = await this.diddyService.updateWinnerClaimed(roundId, body.txHash, user.address);
        return BaseResponse.success(result);
    }
} 