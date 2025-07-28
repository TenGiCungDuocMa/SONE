import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Jackpot,
  JackpotContribution,
  JackpotStatus,
} from 'src/shared/schemas/jackpot.schema';

export class JackpotService {
  private readonly logger = new Logger(JackpotService.name);

  constructor(
    @InjectModel(JackpotContribution.name)
    private jackpotContributionModel: Model<JackpotContribution>,
    @InjectModel(Jackpot.name) private jackpotModel: Model<Jackpot>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async updateLastedJackpotRound(
    roundId: string,
    jackpotFee: string,
    winner: string,
    txTransferred: string,
    status: JackpotStatus,
  ): Promise<Jackpot> {
    try {
      const _lastedJackpotRound = await this.jackpotModel
        .findOne()
        .sort({ createdAt: -1 })
        .lean();
      let jackpotId: number;
      let jackpotData: any;

      const updatedData: any = {};
      if (roundId) {
        updatedData.roundId = roundId;
      }
      if (winner) {
        updatedData.winner = winner;
      }
      if (txTransferred) {
        updatedData.txTransferred = txTransferred;
      }
      if (status) {
        updatedData.status = status;
      }

      if (!_lastedJackpotRound || _lastedJackpotRound.status === 'Ended') {
        // Create jackpot
        jackpotId = _lastedJackpotRound ? _lastedJackpotRound.jackpotId + 1 : 1;
        jackpotData = await this.jackpotModel.create({
          jackpotId: jackpotId,
          totalPool: jackpotFee,
        });
      } else {
        // Update jackpot
        const totalPoolBigInt = BigInt(_lastedJackpotRound.totalPool);
        const jackpotFeeBigInt = BigInt(jackpotFee);
        const jackpotFeeBigIntNew = totalPoolBigInt + jackpotFeeBigInt;
        jackpotId = _lastedJackpotRound.jackpotId;
        jackpotData = await this.jackpotModel.findOneAndUpdate(
          { jackpotId: jackpotId },
          {
            $set: {
              totalPool: jackpotFeeBigIntNew.toString(),
              ...updatedData,
            },
          },
          { new: true, upsert: true },
        );
      }

      if (!jackpotData) {
        throw new Error('Jackpot data not found');
      }

      this.eventEmitter.emit('jackpot_round_updated', jackpotData);

      return jackpotData;
    } catch (error) {
      this.logger.error(`Error updating jackpot round: ${error.message}`);
      throw error;
    }
  }

  async announceJackpotWinner(
    jackpotId: number,
    roundId: string,
    winner: string,
  ): Promise<Jackpot> {
    try {
      const updatedJackpot = await this.jackpotModel.findOneAndUpdate(
        { jackpotId },
        {
          $set: {
            winner: winner.trim(),
            roundId: roundId,
            status: 'Ended',
            endTime: (new Date().getTime() / 1000).toFixed(0),
          },
        },
        { new: true },
      );

      if (!updatedJackpot) {
        throw new Error(`Jackpot round not found for jackpotId: ${jackpotId}`);
      }

      this.eventEmitter.emit('jackpot_announced_winner', updatedJackpot);
      // emit('jackpot_announced_winner', {
      //     ...updatedJackpot
      // });

      return updatedJackpot;
    } catch (error) {
      this.logger.error(`Error updating jackpot round: ${error.message}`);
      throw error;
    }
  }

  async recordJackpotContribution(
    roundId: string,
    jackpotFee: string,
    contributor: string,
  ): Promise<JackpotContribution> {
    try {
      const updatedJackpot = await this.updateLastedJackpotRound(
        '',
        jackpotFee,
        '',
        '',
        JackpotStatus.Processing,
      );

      return await this.jackpotContributionModel.create({
        jackpotId: updatedJackpot.jackpotId,
        roundId,
        jackpotFee,
        contributor: contributor,
      });
    } catch (error) {
      this.logger.error(
        `Error recording jackpot contribution: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 
   * @param roundId ID của một vòng (round)
   * @param totalKuroRoundPool Tổng giá trị của round
   * @param contributor Địa chỉ ví (wallet address) của người đóng góp
   * @returns 
   */
  async randomJackpot(
    roundId: string,
    totalKuroRoundPool: string,
    contributor: string,
  ) {
    const lastedJackpotRound = await this.jackpotModel
      .findOne()
      .sort({ createdAt: -1 })
      .lean();


    // Tính phí jackpot (0.5% của totalKuroRoundPool) để đóng góp vào quỹ jackpot.
    const totalValueBigInt = BigInt(totalKuroRoundPool);
    const jackpotFeeBigInt = (totalValueBigInt * BigInt(5)) / BigInt(1000); // 0.5% = 5/1000
    const jackpotFee = jackpotFeeBigInt.toString();

    if (!lastedJackpotRound) {
      this.recordJackpotContribution(roundId, jackpotFee, contributor);
      return;
    } else {
      const randomValue = Math.random() * 100;
      // Xác suất trúng
      const winProbability = 0.0000015; // 0.00015%
      if (randomValue < winProbability) {
        // win
        await this.announceJackpotWinner(
          lastedJackpotRound.jackpotId,
          roundId,
          contributor,
        );
      }
      this.recordJackpotContribution(roundId, jackpotFee, contributor);
    }
  }

  async fetchAllPools(page: number, limit: number, address?: string) {
    try {
      const skip = (page - 1) * limit;
      const filter: any = {
        status: 'Ended',
      };
      if (address) {
        filter.winner = address;
      }

      const [data, total] = await Promise.all([
        this.jackpotModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec(),
        this.jackpotModel.countDocuments(filter),
      ]);

      return {
        data,
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching all pools:', error);
      throw error;
    }
  }

  async lastedPoolData() {
    try {
      const currentJackpot = await this.jackpotModel
        .findOne()
        .sort({ createdAt: -1 })
        .lean();

      if (!currentJackpot) {
        throw new Error('Jackpot data not found');
      }

      return currentJackpot;
    } catch (error) {
      this.logger.error('Error fetching all pools:', error);
      throw error;
    }
  }
}
