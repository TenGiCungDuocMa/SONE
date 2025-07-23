import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from '../response/BaseResponse';
import { VerifySignatureDto } from './dto/VerifySignature';
@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post("request-signature/:address")
  @ApiOperation({
    summary: "Request a signature message",
    description: "Generates a message for the user to sign using their wallet.",
  })
  @ApiResponse({ status: 200, description: "Message generated successfully" })
  @ApiResponse({ status: 400, description: "Invalid address format" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async requestSignature(@Param("address") address: string) {
    try {
      this.logger.log(`Signature request received for address: ${address}`);

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new BadRequestException("Invalid Ethereum address format");
      }

      const res = await this.authService.requestMessage(address);

      this.logger.log(`Signature message generated for address: ${address}`);
      return BaseResponse.success(res, "Signature message generated successfully.");
    } catch (error) {
      this.logger.error(`Error generating signature message: ${error.message}`, {
        address,
        error: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(false, "Failed to generate signature message", null),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Post("verify-signature")
  // @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: "Verify the signature and generate JWT",
    description: "Verifies the user's signature and generates a JWT token if verification is successful.",
  })
  @ApiResponse({ status: 200, description: "Signature verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async verifySignature(
    @Req() req: any,
    @Body() verifySignatureDto: VerifySignatureDto
  ) {
    try {
      const { address, signature, referralCode } = verifySignatureDto;

      this.logger.log(`Verifying signature for address: ${address}${referralCode ? ` with referral: ${referralCode}` : ''}`);

      const res = await this.authService.verifySignature(
        req,
        address,
        signature,
        referralCode
      );

      this.logger.log(`Signature verified successfully for address: ${address}`);

      return new BaseResponse(
        true,
        "Signature verified and JWT token generated successfully.",
        res
      );
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`, {
        address: verifySignatureDto.address,
        referralCode: verifySignatureDto.referralCode,
        error: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(false, error.message || "Failed to verify signature", null),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}
