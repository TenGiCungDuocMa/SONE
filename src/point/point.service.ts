import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Point, PointDocument, PointType } from 'src/shared/schemas/point.schema';
import { User } from 'src/auth/schemas/user.schema';


@Injectable()
export class PointService {
    constructor(
        @InjectModel(Point.name) private pointModel: Model<PointDocument>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    private async addPoints(
        userId: string | Types.ObjectId,
        amount: number,
        type: PointType,
        description?: string,
        metadata?: Record<string, any>
    ): Promise<Point> {
        const point = new this.pointModel({
            userId: new Types.ObjectId(userId),
            amount,
            type,
            description,
            metadata
        });

        await point.save();

        await this.userModel.findByIdAndUpdate(
            userId,
            { $inc: { totalPoints: amount } }
        );

        return point;
    }

    async addReferralPoints(
        userId: string | Types.ObjectId,
        referralId: string,
        isReferrer: boolean
    ): Promise<Point> {
        const amount = isReferrer ? 100 : 50; // Người giới thiệu 100 điểm, người được giới thiệu 50 điểm
        const description = isReferrer
            ? 'Điểm thưởng giới thiệu thành công'
            : 'Điểm thưởng sử dụng mã giới thiệu';

        return this.addPoints(
            userId,
            amount,
            PointType.REFERRAL,
            description,
            { referralId, isReferrer }
        );
    }

    async getUserPoints(userId: string): Promise<{
        total: number;
        history: Point[];
    }> {
        const [total, history] = await Promise.all([
            this.userModel.findById(userId).select('totalPoints'),
            this.pointModel.find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .exec()
        ]);

        return {
            total: total?.totalPoints || 0,
            history
        };
    }

    async getPointsByType(
        userId: string,
        type: PointType
    ): Promise<Point[]> {
        return this.pointModel.find({
            userId: new Types.ObjectId(userId),
            type
        }).sort({ createdAt: -1 }).exec();
    }

    async getPointsByReferralIds(
        userId: string | Types.ObjectId,
        referralIds: string[]
    ): Promise<Point[]> {
        return this.pointModel.find({
            userId: new Types.ObjectId(userId),
            type: PointType.REFERRAL,
            'metadata.referralId': { $in: referralIds }
        }).exec();
    }
} 