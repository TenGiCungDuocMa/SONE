import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtTokenMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtTokenMiddleware.name);

  constructor(private readonly authService: AuthService) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      this.logger.warn('Authorization header is missing');
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn('Invalid authorization header format');
      return next();
    }

    const token = parts[1];

    try {
      // Kiểm tra token có trong blocklist không
      const isBlocked = await this.authService.isTokenBlocked(token);
      if (isBlocked) {
        this.logger.warn(`Token is in blocklist: ${token.substring(0, 10)}...`);
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Xác thực token
      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        this.logger.warn('Token verification failed');
        throw new UnauthorizedException('Invalid token');
      }

      // Log thông tin để debug
      this.logger.debug(`Token verified successfully for user: ${decoded.address}`);

      next();
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      // Không throw lỗi ở đây, để JwtAuthGuard xử lý
      next();
    }
  }
}