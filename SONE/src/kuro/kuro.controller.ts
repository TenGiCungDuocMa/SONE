import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KuroService } from './kuro.service';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BaseResponse } from 'src/response/BaseResponse';
import { BaseResponsePage } from 'src/response/BaseResponsePage';
import { GetAllPoolsDto } from './dto/get-all.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { KuroSeedService } from './kuro.seed';
import { JwtAuthGuard } from 'src/services/JwtAuthGuard';

@Controller('kuro')
export class KuroController {
  constructor(
    private readonly kuroService: KuroService,
    private readonly kuroSeedService: KuroSeedService,
  ) {}

  @Get('/current-pool')
  @ApiOperation({ summary: 'Get current pool' })
  @ApiResponse({ status: 200, description: 'Current pool' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getPool() {
    const res = await this.kuroService.fetchPoolKuro();
    return BaseResponse.success(res);
  }

  @Get('/pnl')
  @ApiOperation({ summary: 'Get pnl' })
  @ApiResponse({ status: 200, description: 'pnl' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getPnl() {
    const result = await this.kuroService.getPnL();
    return BaseResponse.success(result);
  }

  @Get('/:roundId')
  @ApiOperation({ summary: 'Get pool by roundId' })
  @ApiResponse({ status: 200, description: 'Pool by roundId' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getPoolByRoundId(@Param('roundId') roundId: string) {
    const res = await this.kuroService.fetchPoolKuroByRoundId(roundId);
    return BaseResponse.success(res);
  }

  @Post('get-all-pools')
  @ApiOperation({ summary: 'Get all pools' })
  @ApiResponse({ status: 200, description: 'All pools' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getAllPools(@Body() body: GetAllPoolsDto) {
    const { page, limit, address } = body;

    if (page < 1 || limit < 1) {
      return BaseResponsePage.error('Page and limit must be positive numbers');
    }
    const { data, total } = await this.kuroService.fetchAllPools(
      page,
      limit,
      address,
    );
    return BaseResponsePage.success(
      data,
      page,
      limit,
      total,
      'Pools fetched successfully',
    );
  }

  @Put('/:roundId/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update winner claimed status' })
  @ApiResponse({
    status: 200,
    description: 'Winner claimed status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateWinnerClaimed(
    @Param('roundId') roundId: string,
    @Body() body: UpdateClaimDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const result = await this.kuroService.updateWinnerClaimed(
      roundId,
      body.txHash,
      user.address,
    );
    return BaseResponse.success(result);
  }

  @Post('/seed/participant')
  @ApiOperation({ summary: 'Seed participant' })
  @ApiResponse({ status: 200, description: 'Seed participant' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async seedParticipant() {
    const result = await this.kuroSeedService.updateSeedParticipantDatabase();
    return BaseResponse.success(result);
  }
}
