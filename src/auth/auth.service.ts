import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { verifyMessage } from 'ethers';
import { TokenBlocklist } from 'src/shared/schemas/token-blocklist.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ReferralService } from 'src/referral/referral.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(TokenBlocklist.name)
    private readonly tokenBlocklistModel: Model<TokenBlocklist>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly referralService: ReferralService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      this.logger.error('JWT_SECRET is not defined');
      throw new Error('JWT configuration error');
    }
  }

  async requestMessage(address: string) {
    if (!address || address.length < 42 || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid Ethereum address');
    }

    let user = await this.userModel.findOne({ address: address });
    if (!user) {
      // Tạo referralCode ngay khi tạo người dùng mới
      const referralCodeUser = `${address.slice(2, 8)}-${Date.now().toString(36)}`;

      user = await this.userModel.create({
        address,
        nonce: Math.floor(Math.random() * 1000000),
        referralCode: referralCodeUser,
      });
    } else if (!user.referralCode) {
      // Nếu người dùng đã tồn tại nhưng không có referralCode, tạo mới
      user.nonce = Math.floor(Math.random() * 1000000);
      const referralCodeUser = `${address.slice(2, 8)}-${Date.now().toString(36)}`;
      user.referralCode = referralCodeUser;
      await user.save();
    } else {
      // Cập nhật nonce cho người dùng hiện tại
      user.nonce = Math.floor(Math.random() * 1000000);
      await user.save();
    }

    const domain = 'https://sone.xyz/';
    const statement = 'Sign in with Monad to the app.';
    const uri = 'https://sone.xyz/';
    const version = '1';
    const chainId = 10143;
    const nonce = user.nonce.toString();

    const message =
      `${domain} wants you to sign in with your Monad account: ${address}\n` +
      `Game: Fuku App\n` +
      `Statement: ${statement}\n` +
      `URI: ${uri}\n` +
      `Version: ${version}\n` +
      `Chain ID: ${chainId}\n` +
      `Nonce: ${nonce}`.trim();

    return {
      address: user.address,
      message,
    };
  }
  async verifySignature(
    req: any,
    address: string,
    signature: string,
    referralCode?: string,
  ) {
    const user = await this.userModel.findOne({ address: address });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const domain = 'https://sone.xyz/';
    const statement = 'Sign in with Monad to the app.';
    const uri = 'https://sone.xyz/';
    const version = '1';
    const chainId = 10143;
    const nonce = user.nonce.toString();

    const message =
      `${domain} wants you to sign in with your Monad account: ${address}\n` +
      `Game: Fuku App\n` +
      `Statement: ${statement}\n` +
      `URI: ${uri}\n` +
      `Version: ${version}\n` +
      `Chain ID: ${chainId}\n` +
      `Nonce: ${nonce}`.trim();

    const recovered = verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Signature verification failed');
    }

    // if (referralCode) {
    //   try {
    //     await this.referralService.processReferral(referralCode, address);
    //   } catch (error) {
    //     this.logger.error("Referral processing failed:", error.message);
    //     // Không throw lỗi để người dùng vẫn có thể đăng nhập
    //   }
    // }
    // this.logger.error(`1`);

    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();

    if (!user?._id || !user?.address) {
      throw new Error('User ID or address is missing');
    }

    const payload = {
      sub: user._id,
      address: user.address,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await this.jwtService.signAsync(payload,
      {secret: this.configService.get<string>('JWT_SECRET')});
    // if (!token) {
    //   const refreshToken = await this.jwtService.signAsync(payload, {
    //     expiresIn: '7d',
    //     secret: this.configService.get<string>('JWT_SECRET')
    //   });
    // }

    const result = {
      token,
      // refreshToken,
      user: {
        address: user.address,
        referralCode: user.referralCode,
        rank: null,
        points: 0,
      },
    };


    return result;
  }

  async logout(token: string): Promise<{ success: boolean }> {
    try {
      // Decode the token to extract payload
      const decodedToken = this.jwtService.decode(token);

      if (
        !decodedToken ||
        typeof decodedToken !== 'object' ||
        !('exp' in decodedToken)
      ) {
        this.logger.warn(`Invalid or malformed token: ${token}`);
        throw new UnauthorizedException('Invalid token structure');
      }

      const expirationTime = (decodedToken as { exp: number }).exp;

      if (!expirationTime) {
        this.logger.warn(`Token is missing expiration time: ${token}`);
        throw new UnauthorizedException(
          'Token does not contain an expiration time',
        );
      }

      // Check if token is already in blocklist
      const existingBlocklistEntry = await this.tokenBlocklistModel.findOne({
        token,
      });

      if (existingBlocklistEntry) {
        this.logger.warn(`Token is already invalidated: ${token}`);
        return { success: true }; // Return success for idempotency
      }

      // Add token to the blocklist
      await this.tokenBlocklistModel.create({
        token,
        expiresAt: new Date(expirationTime * 1000), // Convert to milliseconds
      });

      this.logger.log(`Token successfully invalidated: ${token}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      throw new UnauthorizedException('Logout failed. Please try again later.');
    }
  }

  async getUserByAddress(address: string) {
    const user = await this.userModel.findOne({ address });
    if (!user) {
      throw new NotFoundException(`User with address ${address} not found`);
    }

    // Tạo đối tượng kết quả cơ bản trước
    const result = {
      token: null,
      user: {
        address: user.address,
        referralCode: user.referralCode,
        rank: null,
        points: 0,
      },
    };

    // Lấy thông tin về thứ hạng và điểm với timeout
    try {
      // Tạo promise với timeout 3 giây
      // const rankPromise = Promise.race([
      //   this.leaderboardService.getUserRank(address),
      //   new Promise<never>((_, reject) =>
      //     setTimeout(() => reject(new Error('Rank fetch timeout')), 3000)
      //   )
      // ]);

      // const rankData = await rankPromise as any;
      // if (rankData && 'rank' in rankData && 'points' in rankData) {
      //   result.user.rank = rankData.rank;
      //   result.user.points = rankData.points;
      // }
    } catch (error) {
      this.logger.error(`Error getting user rank: ${error.message}`);
      // Tiếp tục với giá trị mặc định đã đặt
    }

    return result;
  }

  async isTokenBlocked(token: string): Promise<boolean> {
    try {
      const blockedToken = await this.tokenBlocklistModel.findOne({ token });
      return !!blockedToken;
    } catch (error) {
      this.logger.error(`Error checking if token is blocked: ${error.message}`);
      throw new UnauthorizedException('Error validating token');
    }
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Xác thực refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Kiểm tra xem refresh token có trong blocklist không
      const isBlocked = await this.tokenBlocklistModel.findOne({ token: refreshToken });
      if (isBlocked) {
        throw new UnauthorizedException('Refresh token has been invalidated');
      }

      // Lấy thông tin người dùng
      const user = await this.userModel.findOne({ _id: decoded.sub });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Tạo token mới
      const payload = {
        sub: user._id,
        address: user.address,
        iat: Math.floor(Date.now() / 1000),
      };

      // Tạo access token mới
      const accessToken = this.jwtService.sign(payload)
      // Tạo refresh token mới với thời hạn dài hơn
      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d', // 7 ngày

      });

      // Thêm refresh token cũ vào blocklist
      await this.tokenBlocklistModel.create({
        token: refreshToken,
        expiresAt: new Date(decoded.exp * 1000),
      });

      return {
        token: accessToken,
        refreshToken: newRefreshToken,
        user: {
          address: user.address,
          referralCode: user.referralCode,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
