import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PointService } from '../point/point.service';
import { User } from 'src/auth/schemas/user.schema';
import { Referral, ReferralDocument } from 'src/shared/schemas/referral.schema';

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly pointService: PointService
  ) { }

  async getReferralsByUser(
    address: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Tìm user theo address
    const user = await this.userModel.findOne({ address });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Tìm tất cả referral liên quan đến user
    const referrals = await this.referralModel.find({
      $or: [
        { referrer: user._id },
        { referred: user._id },
      ],
    })
      .populate('referrer', 'username referralCode address')
      .populate('referred', 'username address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Đếm tổng số referral
    const total = await this.referralModel.countDocuments({
      $or: [
        { referrer: user._id },
        { referred: user._id },
      ],
    });

    // Lấy thông tin điểm từ bảng Point
    const referralIds = referrals.map(ref => ref._id.toString());
    const pointsData = await this.pointService.getPointsByReferralIds(user._id, referralIds);

    // Kết hợp thông tin referral và điểm
    const data = referrals.map(referral => {
      const isReferrer = referral.referrer._id.toString() === user._id.toString();
      const pointInfo = pointsData.find(p =>
        p.metadata?.referralId === referral._id.toString() &&
        p.metadata?.isReferrer === isReferrer
      );

      return {
        ...referral.toObject(),
        userRole: isReferrer ? 'referrer' : 'referred',
        pointsReceived: pointInfo?.amount || 0,
        pointDescription: pointInfo?.description || null
      };
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async validateReferralCode(code: string): Promise<User> {
    const user = await this.userModel.findOne({ referralCode: code });
    if (!user) {
      throw new NotFoundException('Invalid referral code');
    }
    return user;
  }

  async processReferral(referralCode: string, referredAddress: string): Promise<void> {
    // Tìm người giới thiệu bằng referralCode
    const referrer = await this.userModel.findOne({ referralCode });
    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    // Tìm người được giới thiệu bằng address
    const referred = await this.userModel.findOne({ address: referredAddress });
    if (!referred) {
      throw new BadRequestException('Referred user not found');
    }

    // Kiểm tra xem người dùng đã được giới thiệu chưa
    const existingReferral = await this.referralModel.findOne({
      referred: referred._id
    });
    if (existingReferral) {
      throw new BadRequestException('User already has a referrer');
    }

    // Kiểm tra không thể tự giới thiệu chính mình
    if (referrer.address.toLowerCase() === referredAddress.toLowerCase()) {
      throw new BadRequestException('Cannot refer yourself');
    }

    // Tạo referral mới
    const newReferral = new this.referralModel({
      referrer: referrer._id,
      referred: referred._id,
      isCompleted: true,
      completedAt: new Date(),
      rewardAmount: 150,
      rewardClaimed: true
    });

    await newReferral.save();

    // Thêm điểm cho cả hai người dùng
    await Promise.all([
      this.pointService.addReferralPoints(referrer._id, newReferral._id.toString(), true),
      this.pointService.addReferralPoints(referred._id, newReferral._id.toString(), false)
    ]);
  }

  async getUserReferralSummary(address: string): Promise<{
    totalReferrals: number;
    totalReferralPoints: number;
  }> {
    const user = await this.userModel.findOne({ address });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalReferrals = await this.referralModel.countDocuments({
      referrer: user._id,
      isCompleted: true
    });

    const totalReferralPoints = totalReferrals * 100; // Mỗi giới thiệu thành công người giới thiệu nhận được 100 điểm

    return {
      totalReferrals,
      totalReferralPoints
    };
  }
} 