import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createPublicClient, http } from 'viem';
import { DepositTrackerService } from './deposit-tracker.service';
import { Model } from 'mongoose';
import { Kuro, KuroStatus } from 'src/shared/schemas/kuro.schema';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SoneABI } from 'src/abi/SoneABI';

@Injectable()
export class KuroService implements OnModuleInit {
  private readonly logger = new Logger(KuroService.name);
  private client: any;
  private processedWinners: Set<string> = new Set(); // Track processed winners
  private isProcessingWinner: boolean = false; // Flag to check if processing a winner

  constructor(
    private configService: ConfigService,
    private depositTrackerService: DepositTrackerService,
    @InjectModel(Kuro.name) private kuroModel: Model<Kuro>,
    private eventEmitter: EventEmitter2,
  ) {
    const rpcUrl = <string>this.configService.get<string>('RPC_URL');
    const chainId = Number(this.configService.get('CHAIN_ID'));

    this.client = createPublicClient({
      chain: {
        id: chainId,
        name: 'Somnia Testnet',
        rpcUrls: {
          default: {
            http: [rpcUrl],
            webSocket: [rpcUrl.replace('http', 'ws')],
          },
        },
        nativeCurrency: {
          name: 'Somnia',
          symbol: 'STT',
          decimals: 18,
        },
      },
      transport: http(),
    });
  }

  async onModuleInit() {
    this.logger.log('KuroService initialized - Starting pool tracking');
    // Fetch pool data immediately on init
    await this.fetchPoolKuro();
    // Check if there are winners not yet notified
    await this.checkForUnprocessedWinners();
  }

  // Run every 5 seconds
  @Cron('*/5 * * * * *')
  async scheduledFetchPoolKuro() {
    this.logger.log('Running scheduled pool fetch');
    try {
      // If processing a winner, skip this fetch
      if (this.isProcessingWinner) {
        this.logger.log('Currently processing a winner, skipping fetch');
        return;
      }

      await this.fetchPoolKuro();

      // Check for winners after each fetch
      await this.checkForUnprocessedWinners();
    } catch (error) {
      this.logger.error(`Error in scheduled fetch: ${error.message}`);
    }
  }

  /**
   * Check for completed rounds with winners that haven't been announced
   */
  private async checkForUnprocessedWinners() {
    try {
      const currentRoundId = await this.getCurrentRoundId();
      const previousRoundId = currentRoundId - 1;

      // Check previous round
      const previousRound = await this.kuroModel
        .findOne({
          roundId: previousRoundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        })
        .lean();

      if (
        previousRound &&
        (previousRound.status === KuroStatus.DRAWN ||
          previousRound.status === KuroStatus.CANCELLED) &&
        previousRound.winner !== '0x0000000000000000000000000000000000000000' &&
        !this.processedWinners.has(previousRoundId.toString())
      ) {
        // Mark as processing winner
        this.isProcessingWinner = true;

        // Mark this round's winner as processed
        this.processedWinners.add(previousRoundId.toString());

        this.logger.log(
          `Detected unannounced winner of round ${previousRoundId}: ${previousRound.winner}`,
        );

        // Emit winner_announced event
        this.eventEmitter.emit('kuro.winner_announced', {
          roundId: previousRoundId,
          winner: previousRound.winner,
          drawnAt: previousRound.drawnAt,
          totalValue: previousRound.totalValue,
          participants: previousRound.participants || [],
        });

        // Wait 15 seconds before continuing to process new rounds
        this.logger.log(`Waiting 15 seconds to display winner...`);
        setTimeout(() => {
          this.isProcessingWinner = false;
          this.logger.log(
            `Completed processing winner of round ${previousRoundId}`,
          );
        }, 15000);
      }
    } catch (error) {
      this.logger.error(
        `Error checking for unprocessed winners: ${error.message}`,
      );
      this.isProcessingWinner = false;
    }
  }

  /**
   * Get latest Kuro data to send via WebSocket
   */
  async getLatestKuroData() {
    try {
      const currentRoundId = await this.getCurrentRoundId();
      const previousRoundId = currentRoundId - 1;
      const previousRound = await this.kuroModel
        .findOne({
          roundId: previousRoundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        })
        .lean();

      let roundId = -1;
      if (!previousRound) {
        roundId = currentRoundId;
      } else if (
        previousRound.winner == '0x0000000000000000000000000000000000000000' &&
        (previousRound.status == KuroStatus.DRAWN ||
          previousRound.status == KuroStatus.OPEN)
      ) {
        roundId = previousRoundId;
      } else {
        roundId = currentRoundId;
      }

      const kuroData = await this.kuroModel
        .findOne({
          roundId: roundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        })
        .lean();

      if (!kuroData) {
        this.logger.warn(`No Kuro data found for round ID: ${currentRoundId}`);
        return {
          error: 'No data available',
          roundId: currentRoundId.toString(),
        };
      }

      // Check if displaying a winner
      const isShowingWinner =
        this.isProcessingWinner &&
        previousRound &&
        previousRound.status === KuroStatus.DRAWN &&
        previousRound.winner !== '0x0000000000000000000000000000000000000000';

      return {
        roundId: roundId,
        status: kuroData.status,
        startTime: kuroData.startTime,
        endTime: kuroData.endTime,
        drawnAt: kuroData.drawnAt,
        numberOfParticipants: kuroData.numberOfParticipants,
        winner: kuroData.winner,
        totalValue: kuroData.totalValue,
        totalEntries: kuroData.totalEntries,
        participants: kuroData.participants || [],
        isShowingWinner: isShowingWinner,
        currentRoundId: currentRoundId.toString(),
        kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
      };
    } catch (error) {
      this.logger.error(`Error fetching latest Kuro data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current round ID
   */
  private async getCurrentRoundId(): Promise<number> {
    const currentRoundId = await this.client.readContract({
      address: this.configService.get<string>('SONE_ADDRESS'),
      abi: SoneABI,
      functionName: 'currentRoundId',
    });

    return Number(currentRoundId);
  }

  async fetchPoolKuro() {
    try {
      const currentRoundId = await this.getCurrentRoundId();
      const previousRoundId = currentRoundId - 1;
      const previousRound = await this.kuroModel
        .findOne({
          roundId: previousRoundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        })
        .lean();
      let roundId = -1;

      if (!previousRound) {
        roundId = currentRoundId;
      } else if (
        previousRound.winner == '0x0000000000000000000000000000000000000000' &&
        (previousRound.status == KuroStatus.DRAWN ||
          previousRound.status == KuroStatus.OPEN)
      ) {
        roundId = previousRoundId;
      } else {
        roundId = currentRoundId;
      }

      this.logger.log(`Current round ID Processed: ${roundId}`);

      const currentPool = await this.client.readContract({
        address: this.configService.get<string>('SONE_ADDRESS'),
        abi: SoneABI,
        functionName: 'getRoundInfo',
        args: [roundId],
      });

      const status = Number(currentPool[0]);
      const startTime = Number(currentPool[1]);
      const endTime = Number(currentPool[2]);
      const drawnAt = Number(currentPool[3]);
      const numberOfParticipants = Number(currentPool[4]);
      const winner = currentPool[5] as string;
      const totalValue = Number(currentPool[6]);
      const totalEntries = Number(currentPool[7]);
      const protocolFeeOwed = Number(currentPool[8]);
      const prizesClaimed = Boolean(currentPool[9]);
      ``;

      const participants = await this.depositTrackerService.trackDeposit(
        Number(roundId),
      );
      this.logger.log(`[KURO_SERVICE] Participants: ${participants}`);

      await this.kuroModel.findOneAndUpdate(
        {
          roundId: roundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        },
        {
          status,
          startTime,
          endTime,
          drawnAt,
          numberOfParticipants,
          winner,
          totalValue,
          totalEntries,
          participants,
          protocolFeeOwed,
          prizesClaimed,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        },
        { upsert: true },
      );

      // Check if this round just completed with a valid winner and hasn't been processed
      if (
        status === KuroStatus.DRAWN &&
        winner !== '0x0000000000000000000000000000000000000000' &&
        !this.processedWinners.has(roundId.toString()) &&
        !this.isProcessingWinner
      ) {
        this.logger.log(
          `Round ${roundId} just completed with winner: ${winner}`,
        );
      }

      if (status === KuroStatus.CANCELLED && participants.length == 1) {
        await this.kuroModel.findOneAndUpdate(
          {
            roundId: roundId,
            kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
          },
          {
            winner: participants[0].address,
          },
          { upsert: true },
        );
      }

      return {
        status: status,
        startTime: startTime,
        endTime: endTime,
        drawnAt: drawnAt,
        numberOfParticipants: numberOfParticipants,
        winner: winner,
        totalValue: totalValue,
        totalEntries: totalEntries,
        protocolFeeOwed: protocolFeeOwed,
        prizesClaimed: prizesClaimed,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async fetchPoolKuroByRoundId(roundId: string) {
    const kuro = await this.kuroModel
      .findOne({
        roundId: roundId,
        kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
      })
      .lean();
    return kuro;
  }

  async fetchAllPools(page: number, limit: number, address?: string) {
    try {
      const skip = (page - 1) * limit;
      // Create query filter
      const filter = address ? { winner: address } : {};

      const [data, total] = await Promise.all([
        this.kuroModel
          .find(filter) //Tìm các tài liệu khớp với filter
          //Lọc thêm các bản ghi có trường status
          // không nằm trong ($nin) danh sách [KuroStatus.NONE, KuroStatus.OPEN]
          .where({ status: { $nin: [KuroStatus.NONE, KuroStatus.OPEN] } })
          .skip(skip) //Bỏ qua số bản ghi được tính từ skip (cho phân trang)
          .limit(limit) //Giới hạn số bản ghi trả về
          .sort({ createdAt: -1 }) //Sắp xếp kết quả theo trường createdAt theo thứ tự giảm dần
          .exec(), //Thực thi truy vấn và trả về một Promise
        this.kuroModel.countDocuments(filter),
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

  /**
   * Cập nhật phần thưởng cho winner
   * @param roundId ID của vòng (round) trong hệ thống, dùng để xác định một vòng cụ thể trong cơ sở dữ liệu.
   * @param txHash Hash của giao dịch (transaction hash)
   * @param userAddress Địa chỉ ví (wallet address) của người dùng
   * @returns
   */
  async updateWinnerClaimed(
    roundId: string,
    txHash: string,
    userAddress: string,
  ) {
    try {
      // Find round with roundId
      const round = await this.kuroModel
        .findOne({
          roundId: roundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        })
        .lean();

      if (!round) {
        throw new Error(`Round ${roundId} does not exist`);
      }

      // Check if round has ended and has a winner
      // Đây là địa chỉ "zero" trên blockchain (thường là Ethereum),
      // biểu thị rằng round chưa có người chiến thắng hoặc chưa kết thúc.
      if (round.winner === '0x0000000000000000000000000000000000000000') {
        throw new Error(
          `Round ${roundId} has not ended or does not have a winner`,
        );
      }

      if (round.winner !== userAddress) {
        throw new Error(`You are not the winner of round ${roundId}`);
      }

      // Check if winner has already claimed
      if (round.winnerClaimed) {
        throw new Error(
          `Winner of round ${roundId} has already claimed the prize`,
        );
      }

      // Update claimed status
      await this.kuroModel.findOneAndUpdate(
        {
          roundId: roundId,
          kuroContractAddress: this.configService.get<string>('SONE_ADDRESS'),
        },
        {
          winnerClaimed: true,
          txClaimed: txHash,
        },
      );

      return { success: true, message: 'Successfully updated claim status' };
    } catch (error) {
      this.logger.error(
        `Error updating winner claimed status: ${error.message}`,
      );
      throw error;
    }
  }

  async getPnL() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const latestPnl = await this.kuroModel
        .aggregate([
          {
            $match: {
              status: KuroStatus.DRAWN,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
          {
            $unwind: '$participants',
          },
          {
            $addFields: {
              participantTotalEntries: { $toDouble: '$totalValue' },
              winnerTotalEntries: {
                $cond: {
                  if: { $eq: ['$participants.address', '$winner'] },
                  then: {
                    $sum: {
                      $map: {
                        input: '$participants.deposits',
                        as: 'deposit',
                        in: { $toDouble: '$$deposit.amount' },
                      },
                    },
                  },
                  else: 0,
                },
              },
            },
          },
          {
            $group: {
              _id: '$participants.address',
              roundId: { $first: '$roundId' },
              totalParticipantEntries: { $sum: '$participantTotalEntries' },
              totalWinnerEntries: { $sum: '$winnerTotalEntries' },
            },
          },
          {
            $project: {
              roundId: '$roundId',
              winner: '$_id',
              pnl: {
                $cond: {
                  if: { $gt: ['$totalWinnerEntries', 0] },
                  then: {
                    $divide: [
                      '$totalParticipantEntries',
                      '$totalWinnerEntries',
                    ],
                  },
                  else: 0,
                },
              },
            },
          },
          {
            $sort: { pnl: -1 },
          },
        ])
        .exec()
        .then((result) => result[0] || null);

      if (!latestPnl) {
        throw new Error('No data found');
      }

      const pnl24h = await this.kuroModel
        .aggregate([
          // Lọc document trong 24h và status DRAWN
          {
            $match: {
              status: KuroStatus.DRAWN,
              createdAt: { $gte: twentyFourHoursAgo },
            },
          },
          // Tách mảng participants
          {
            $unwind: '$participants',
          },
          // Tính totalEntries cho participant
          {
            $addFields: {
              participantTotalEntries: { $toDouble: '$totalValue' },
              winnerTotalEntries: {
                $cond: {
                  if: { $eq: ['$participants.address', '$winner'] },
                  then: {
                    $sum: {
                      $map: {
                        input: '$participants.deposits',
                        as: 'deposit',
                        in: { $toDouble: '$$deposit.amount' },
                      },
                    },
                  },
                  else: 0,
                },
              },
            },
          },
          // Nhóm theo address
          {
            $group: {
              _id: '$participants.address',
              totalParticipantEntries: { $sum: '$participantTotalEntries' },
              totalWinnerEntries: { $sum: '$winnerTotalEntries' },
            },
          },
          // Tính PNL
          {
            $project: {
              winner: '$_id',
              pnl: {
                $cond: {
                  if: { $gt: ['$totalWinnerEntries', 0] },
                  then: {
                    $divide: [
                      '$totalParticipantEntries',
                      '$totalWinnerEntries',
                    ],
                  },
                  else: 0,
                },
              },
            },
          },
          // Sắp xếp theo PNL giảm dần và lấy document đầu tiên
          {
            $sort: { pnl: -1 },
          },
          {
            $limit: 1,
          },
        ])
        .exec()
        .then((result) => result[0] || null);

      return {
        lastedPnL: latestPnl,
        pnL24h: pnl24h,
      };
    } catch (error) {
      this.logger.error(
        `Error updating winner claimed status: ${error.message}`,
      );
      throw error;
    }
  }
}
