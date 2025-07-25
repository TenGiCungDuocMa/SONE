import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GetAllPoolsDto } from "./dto/get-all.dto";
import { JackpotService } from "./jackpot.service";
import { BaseResponsePage } from "src/response/BaseResponsePage";

@Controller('jackpot')
export class JackpotController {

    constructor(private readonly JackpotService: JackpotService) { }

    @Post()
    @ApiOperation({ summary: 'Get all pools' })
    @ApiResponse({ status: 200, description: 'All pools' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async getAllPools(@Body() body: GetAllPoolsDto) {
        const { page, limit, address } = body;
        const { data, total } = await this.JackpotService.fetchAllPools(page, limit, address);
        return BaseResponsePage.success(
            data,
            page,
            limit,
            total,
            'Pools fetched successfully'
        );
    }

}