import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { BaseResponse } from 'src/response/BaseResponse';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { CreateReferralDto, GetReferralsQueryDto } from './dto/referral.dto';
import { BaseResponsePage } from 'src/response/BaseResponsePage';

@Controller('referral')
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    @Post('user/:address')
    @ApiOperation({ summary: 'Get referrals by user address' })
    @ApiBody({ type: GetReferralsQueryDto })
    async getReferralsByUser(
        @Param('address') address: string,
        @Body() body: GetReferralsQueryDto
    ) {
        const res = await this.referralService.getReferralsByUser(
            address,
            body.page,
            body.limit
        );
        return BaseResponsePage.success(res.data, res.total, body.page, body.limit);
    }

    @Get('validate/:code')
    @ApiOperation({ summary: 'Validate referral code' })
    async validateReferralCode(@Param('code') code: string) {
        const res = await this.referralService.validateReferralCode(code);
        return BaseResponse.success(res);
    }

    @Get('summary/:address')
    @ApiOperation({ summary: 'Get referral summary for user (total referrals and points)' })
    async getUserReferralSummary(@Param('address') address: string) {
        const summary = await this.referralService.getUserReferralSummary(address);
        return BaseResponse.success(summary);
    }
} 