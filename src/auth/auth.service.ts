import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { TokenBlocklist } from 'src/shared/schemas/token-blocklist.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ReferralService } from 'src/referral/referral.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
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

    const domain = "https://fukunad.xyz/";
    const statement = "Sign in with Monad to the app.";
    const uri = "https://fukunad.xyz/";
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
}
