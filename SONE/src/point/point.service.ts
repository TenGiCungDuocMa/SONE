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
} 