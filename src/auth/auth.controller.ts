import { BadRequestException, Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from '../response/BaseResponse';

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post("request-signature")
  @ApiOperation({
    summary: "Request a signature message",
    description: "Generates a message for the user to sign using their wallet.",
  })
  @ApiResponse({ status: 200, description: "Message generated successfully" })
  @ApiResponse({ status: 400, description: "Invalid address format" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async requestSignature(@Body("address") address: string) {
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
}
