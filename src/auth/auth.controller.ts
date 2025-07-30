import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BaseResponse } from '../response/BaseResponse';
import { VerifySignatureDto } from './dto/VerifySignature';
import { JwtAuthGuard } from '../services/JwtAuthGuard';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Get('sign-message/:message')
  @ApiOperation({
    summary: 'Get sign message',
    description: 'Returns a message for the user to sign using their wallet.',
  })
  @Post('request-signature/:address')
  @ApiOperation({
    summary: 'Request a signature message',
    description: 'Generates a message for the user to sign using their wallet.',
  })
  @ApiResponse({ status: 200, description: 'Message generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address format' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestSignature(@Param('address') address: string) {
    try {
      this.logger.log(`Signature request received for address: ${address}`);

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new BadRequestException('Invalid Ethereum address format');
      }

      const res = await this.authService.requestMessage(address);

      this.logger.log(`Signature message generated for address: ${address}`);
      return BaseResponse.success(
        res,
        'Signature message generated successfully.',
      );
    } catch (error) {
      this.logger.error(
        `Error generating signature message: ${error.message}`,
        {
          address,
          error: error.stack,
        },
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(false, 'Failed to generate signature message', null),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-signature')
  // @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Verify the signature and generate JWT',
    description:
      "Verifies the user's signature and generates a JWT token if verification is successful.",
  })
  @ApiResponse({ status: 200, description: 'Signature verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifySignature(
    @Req() req: any,
    @Body() verifySignatureDto: VerifySignatureDto,
  ) {
    try {
      const { address, signature } = verifySignatureDto;
      const res = await this.authService.verifySignature(
        req,
        address,
        signature,
      );

      this.logger.log(
        `Signature verified successfully for address: ${address}`,
      );

      return new BaseResponse(
        true,
        'Signature verified and JWT token generated successfully.',
        res,
      );
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`, {
        address: verifySignatureDto.address,
        error: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(
          false,
          error.message || 'Failed to verify signature',
          null,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logs out the user by invalidating the provided JWT token.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(@Req() req: any) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new BadRequestException('Authorization header is missing');
      }

      const token = authHeader.split(' ')[1];
      const res = await this.authService.logout(token);

      this.logger.log(`User logged out successfully: ${req.user.address}`);

      return new BaseResponse(true, 'Token successfully invalidated', res);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, {
        userId: req.user?.address,
        error: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(false, 'Failed to logout', null),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user information',
    description:
      "Retrieves the current user's information based on the JWT token.",
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: any) {
    try {
      const { address } = req.user;
      this.logger.log(`Fetching user information for address: ${address}`);
      const auth = req.headers.authorization;
      const token = auth.split(' ')[1];
      const userData = await this.authService.getUserByAddress(address, token);

      return new BaseResponse(
        true,
        'User information retrieved successfully.',
        userData,
      );
    } catch (error) {
      this.logger.error(`Failed to get user information: ${error.message}`, {
        userId: req.user?.address,
        error: error.stack,
      });

      throw new HttpException(
        new BaseResponse(false, error.message, null),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-token/:token')
  @ApiOperation({
    summary: 'Check if token is valid',
    description:
      'Checks if the provided token is valid and not in the blocklist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token status checked successfully',
  })
  async checkToken(@Param('token') token: string) {
    try {
      this.logger.log(`Checking token validity`);

      if (!token) {
        throw new BadRequestException('Token is required');
      }

      // Kiểm tra token trong blocklist
      const isBlocked = await this.authService.isTokenBlocked(token);

      // Kiểm tra token có hợp lệ không
      let isValid = false;
      try {
        const decoded = this.authService.verifyToken(token);
        isValid = !!decoded;
      } catch (error) {
        isValid = false;
      }

      return new BaseResponse(true, 'Token status checked successfully', {
        isValid,
        isBlocked,
      });
    } catch (error) {
      this.logger.error(`Token check failed: ${error.message}`, {
        error: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        new BaseResponse(false, error.message || 'Failed to check token', null),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get("debug-token")
  // @ApiOperation({
  //   summary: "Debug token",
  //   description: "Debug the token in the Authorization header.",
  // })
  // @ApiResponse({ status: 200, description: "Token debug information" })
  // async debugToken(@Req() req) {
  //   try {
  //     const authHeader = req.headers.authorization;

  //     if (!authHeader) {
  //       return new BaseResponse(
  //         true,
  //         "No token provided",
  //         { hasToken: false }
  //       );
  //     }

  //     const parts = authHeader.split(" ");
  //     if (parts.length !== 2 || parts[0] !== 'Bearer') {
  //       return new BaseResponse(
  //         true,
  //         "Invalid token format",
  //         {
  //           hasToken: true,
  //           isValidFormat: false,
  //           header: authHeader
  //         }
  //       );
  //     }

  //     const token = parts[1];

  //     // Kiểm tra token có trong blocklist không
  //     const isBlocked = await this.authService.isTokenBlocked(token);

  //     // Kiểm tra token có hợp lệ không
  //     let decoded = null;
  //     let isValid = false;
  //     try {
  //       decoded = this.authService.verifyToken(token);
  //       isValid = !!decoded;
  //     } catch (error) {
  //       isValid = false;
  //     }

  //     return new BaseResponse(
  //       true,
  //       "Token debug information",
  //       {
  //         hasToken: true,
  //         isValidFormat: true,
  //         isValid,
  //         isBlocked,
  //         decoded,
  //         tokenPreview: token.substring(0, 20) + '...'
  //       }
  //     );
  //   } catch (error) {
  //     this.logger.error(`Token debug failed: ${error.message}`, {
  //       error: error.stack,
  //     });

  //     return new BaseResponse(
  //       false,
  //       "Error debugging token",
  //       { error: error.message }
  //     );
  //   }
  // }

  // @Post("refresh-token/:refreshToken")
  // @ApiOperation({
  //   summary: "Refresh JWT token",
  //   description: "Refreshes the JWT token using a refresh token.",
  // })
  // @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  // @ApiResponse({ status: 401, description: "Invalid refresh token" })
  // async refreshToken(@Param("refreshToken") refreshToken: string) {
  //   try {
  //     this.logger.log(`Refreshing token`);
  //
  //     if (!refreshToken) {
  //       throw new BadRequestException("Refresh token is required");
  //     }
  //
  //     const result = await this.authService.refreshToken(refreshToken);
  //
  //     return new BaseResponse(
  //       true,
  //       "Token refreshed successfully",
  //       result
  //     );
  //   } catch (error) {
  //     this.logger.error(`Token refresh failed: ${error.message}`, {
  //       error: error.stack,
  //     });
  //
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //
  //     throw new HttpException(
  //       new BaseResponse(false, error.message || "Failed to refresh token", null),
  //       HttpStatus.UNAUTHORIZED
  //     );
  //   }
  // }
}
