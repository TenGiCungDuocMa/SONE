import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';


@Injectable()
export class PointService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async getUsersSortedByPointsDesc(): Promise<User[]> {
    return this.userModel.find().sort({ totalPoints: -1 }).exec();
  }
} 