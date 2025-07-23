import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { verifyMessage } from "ethers";
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
  ) { }

  async requestMessage(address: string) {
    if (!address || address.length < 42 || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid Ethereum address");
    }

    let user = await this.userModel.findOne({ address: address });

    if (!user) {
      // Tạo referralCode ngay khi tạo người dùng mới
      const referralCodeUser = `${address.slice(2, 8)}-${Date.now().toString(36)}`;

      user = await this.userModel.create({
        address,
        nonce: Math.floor(Math.random() * 1000000),
        referralCode: referralCodeUser
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

    const domain = "https://sone.xyz/";
    const statement = "Sign in with Monad to the app.";
    const uri = "https://sone.xyz/";
    const version = "1";
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
      message
    };
  }
  async verifySignature(
    req: any,
    address: string,
    signature: string,
    referralCode?: string
  ) {
    const user = await this.userModel.findOne({ address });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const domain = "";
    const statement = "Sign in with Monad to the app.";
    const uri = "";
    const version = "1";
    const chainId = 10143;
    const nonce = user.nonce.toString();

    const message =
      `${domain} wants you to sign in with your Monad account: ${address}\n` +
      `Game: Sone App\n` +
      `Statement: ${statement}\n` +
      `URI: ${uri}\n` +
      `Version: ${version}\n` +
      `Chain ID: ${chainId}\n` +
      `Nonce: ${nonce}`.trim();

    const recovered = verifyMessage(message, signature);

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Signature verification failed");
    }

    if (referralCode) {
      try {
        await this.referralService.processReferral(referralCode, address);
      } catch (error) {
        this.logger.error("Referral processing failed:", error.message);
        // Không throw lỗi để người dùng vẫn có thể đăng nhập
      }
    }

    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();

    const payload = {
      sub: user._id,
      address: user.address,
      iat: Math.floor(Date.now() / 1000),
    };
    const token = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const result = {
      token,
      refreshToken,
      user: {
        address: user.address,
        referralCode: user.referralCode,
        rank: null,
        points: 0
      }
    };
    return result;
  }

}
