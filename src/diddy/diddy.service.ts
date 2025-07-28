// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectModel } from '@nestjs/mongoose';
// import { DiddyABI } from 'src/abi/DiddyABI';
// import { createPublicClient, http } from 'viem';
// import { Model } from 'mongoose';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { Diddy, DiddyStatus } from '../shared/schemas/diddy.schema';
// import { DepositTrackerService } from './deposit-tracker.service';

// @Injectable()
// export class DiddyService implements OnModuleInit {
//     private readonly logger = new Logger(DiddyService.name);
//     private readonly logPrefix = '\x1b[36m[DIDDY]\x1b[0m'; // Cyan color
//     private client: any;
//     private processedWinners: Set<string> = new Set();
//     private isProcessingWinner: boolean = false;

//     constructor(
//         private configService: ConfigService,
//         private depositTrackerService: DepositTrackerService,
//         @InjectModel(Diddy.name) private diddyModel: Model<Diddy>,
//         private eventEmitter: EventEmitter2
//     ) {
//         const rpcUrl = <string>this.configService.get<string>('RPC_URL');
//         const chainId = parseInt(<string>this.configService.get('CHAIN_ID'));

//         this.client = createPublicClient({
//             chain: {
//                 id: chainId,
//                 name: 'Monad Testnet',
//                 rpcUrls: {
//                     default: { http: [rpcUrl] }
//                 },
//                 nativeCurrency: {
//                     name: 'Monad',
//                     symbol: 'MON',
//                     decimals: 18
//                 }
//             },
//             transport: http(),
//         });
//     }

//     async onModuleInit() {
//         this.logger.log(`${this.logPrefix} Service initialized - Starting pool tracking`);
//         // await this.fetchPoolDiddy();
//         // await this.checkForUnprocessedWinners();
//         this.setupEventListeners();
//     }

//     private setupEventListeners() {
//         this.eventEmitter.on('diddy.winner_announced', async (data) => {
//             try {
//                 if (this.processedWinners.has(data.roundId.toString())) {
//                     this.logger.log(`${this.logPrefix} Round ${data.roundId} already processed, skipping...`);
//                     return;
//                 }

//                 this.logger.log(`${this.logPrefix} Winner announced for round ${data.roundId}: ${data.winners.map(w => w.address).join(', ')}`);

//                 this.processedWinners.add(data.roundId.toString());

//                 await this.diddyModel.findOneAndUpdate(
//                     { roundId: data.roundId },
//                     {
//                         winners: data.winners,
//                         drawnAt: data.drawnAt,
//                         status: DiddyStatus.DRAWN
//                     }
//                 );

//                 this.eventEmitter.emit('diddy.winner_announced', {
//                     roundId: data.roundId,
//                     winners: data.winners,
//                     drawnAt: data.drawnAt,
//                     totalValue: data.totalValue,
//                     participants: data.participants || [],
//                     safeRoom: data.safeRoom
//                 });

//                 setTimeout(() => {
//                     this.isProcessingWinner = false;
//                     this.logger.log(`${this.logPrefix} Completed processing winners of round ${data.roundId}`);
//                 }, 15000);

//             } catch (error) {
//                 this.logger.error(`${this.logPrefix} Error handling winner announcement:`, error);
//                 this.processedWinners.delete(data.roundId.toString());
//                 this.isProcessingWinner = false;
//             }
//         });

//         this.eventEmitter.on('diddy.round_cancelled', async (data) => {
//             try {
//                 this.logger.log(`${this.logPrefix} Round ${data.roundId} cancelled`);
//                 await this.handleCancelledRound(data.roundId);

//                 this.eventEmitter.emit('diddy.round_cancelled', {
//                     roundId: data.roundId,
//                     cancelledAt: Date.now()
//                 });
//             } catch (error) {
//                 this.logger.error(`${this.logPrefix} Error handling round cancellation:`, error);
//             }
//         });

//         this.eventEmitter.on('diddy.new_round', async (data) => {
//             try {
//                 this.logger.log(`${this.logPrefix} New round started: ${data.roundId}`);

//                 this.eventEmitter.emit('diddy.new_round', {
//                     roundId: data.roundId,
//                     startTime: data.startTime,
//                     endTime: data.endTime,
//                     status: DiddyStatus.OPEN
//                 });
//             } catch (error) {
//                 this.logger.error(`${this.logPrefix} Error handling new round:`, error);
//             }
//         });
//     }

//     @Cron('*/10 * * * * *')
//     async scheduledFetchPoolDiddy() {
//         this.logger.log(`${this.logPrefix} Running scheduled pool fetch`);
//         try {
//             if (this.isProcessingWinner) {
//                 this.logger.log(`${this.logPrefix} Currently processing a winner, skipping fetch`);
//                 return;
//             }

//             await this.fetchPoolDiddy();
//             await this.checkForUnprocessedWinners();
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error in scheduled fetch: ${error.message}`);
//         }
//     }

//     private async checkForUnprocessedWinners() {
//         try {
//             const currentRoundId = await this.getCurrentRoundId();
//             const previousRoundId = currentRoundId - 1;

//             const previousRound = await this.diddyModel.findOne({ roundId: previousRoundId }).lean();

//             if (previousRound &&
//                 (previousRound.status === DiddyStatus.DRAWN || previousRound.status === DiddyStatus.CANCELLED) &&
//                 !this.processedWinners.has(previousRoundId.toString())) {

//                 this.isProcessingWinner = true;
//                 this.processedWinners.add(previousRoundId.toString());

//                 const eventData = {
//                     roundId: previousRoundId,
//                     winners: previousRound.winners || [],
//                     drawnAt: previousRound.drawnAt,
//                     totalValue: previousRound.totalValue,
//                     participants: previousRound.participants || [],
//                     safeRoom: previousRound.safeRoom
//                 };

//                 this.eventEmitter.emit('diddy.winner_announced', eventData);

//                 setTimeout(() => {
//                     this.isProcessingWinner = false;
//                     this.logger.log(`${this.logPrefix} Completed processing winners of round ${previousRoundId}`);
//                 }, 15000);
//             }
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error checking for unprocessed winners: ${error.message}`);
//             this.isProcessingWinner = false;
//         }
//     }

//     async getLatestDiddyData() {
//         try {
//             const currentRoundId = await this.getCurrentRoundId();
//             const previousRoundId = currentRoundId - 1;
//             const previousRound = await this.diddyModel.findOne({ roundId: previousRoundId }).lean();

//             let roundId = -1;
//             if (!previousRound) {
//                 roundId = currentRoundId;
//             }
//             else if (previousRound.status === DiddyStatus.DRAWING || previousRound.status === DiddyStatus.OPEN) {
//                 roundId = previousRoundId;
//             } else {
//                 roundId = currentRoundId;
//             }

//             const diddyData = await this.diddyModel.findOne({ roundId: roundId }).lean();

//             if (!diddyData) {
//                 this.logger.warn(`${this.logPrefix} No Diddy data found for round ID: ${currentRoundId}`);
//                 return { error: 'No data available', roundId: currentRoundId.toString() };
//             }

//             const isShowingWinner = this.isProcessingWinner &&
//                 previousRound &&
//                 previousRound.status === DiddyStatus.DRAWN;

//             return {
//                 roundId: roundId,
//                 status: diddyData.status,
//                 startTime: diddyData.startTime,
//                 endTime: diddyData.endTime,
//                 drawnAt: diddyData.drawnAt,
//                 numberOfPlayers: diddyData.numberOfPlayers,
//                 safeRoom: diddyData.safeRoom,
//                 totalValue: diddyData.totalValue,
//                 totalEntries: diddyData.totalEntries,
//                 protocolFeeOwed: diddyData.protocolFeeOwed,
//                 winners: diddyData.winners || [],
//                 participants: diddyData.participants || [],
//                 isShowingWinner: isShowingWinner,
//                 currentRoundId: currentRoundId.toString(),
//                 carryOverReward: diddyData.carryOverReward
//             };
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error fetching latest Diddy data: ${error.message}`);
//             throw error;
//         }
//     }

//     private async getCurrentRoundId(): Promise<number> {
//         const currentRoundId = await this.client.readContract({
//             address: this.configService.get<string>('DIDDY_ADDRESS'),
//             abi: DiddyABI,
//             functionName: 'currentRoundId',
//         });

//         return Number(currentRoundId);
//     }

//     async calculatePrize(roundId: string, winnerAddress: string, status: DiddyStatus) {
//         const round = await this.diddyModel.findOne({ roundId }).lean();
//         if (!round) {
//             throw new Error('Round not found')
//         }
//         const winner = round.winners.find(w => w.address === winnerAddress);

//         if (!winner) {
//             throw new Error('Winner not found');
//         }

//         if (status === DiddyStatus.CANCELLED) {
//             return winner.deposit;
//         }

//         const totalPrizePool = BigInt(round.totalValue + round.carryOverReward) - BigInt(round.protocolFeeOwed);
//         const winnerShare = (BigInt(winner.deposit) * totalPrizePool) / BigInt(round.totalValue + round.carryOverReward);

//         return winnerShare.toString();
//     }

//     async handleCancelledRound(roundId: string) {
//         const round = await this.diddyModel.findOne({ roundId }).lean();
//         if (!round) {
//             throw new Error('Round not found')
//         }
//         if (round.status === DiddyStatus.CANCELLED) {
//             const refunds = round.participants.map(p => ({
//                 address: p.address,
//                 deposit: p.deposit,
//                 claimed: false,
//                 txHash: '',
//                 claimedAt: 0
//             }));

//             await this.diddyModel.findOneAndUpdate(
//                 { roundId },
//                 { winners: refunds }
//             );
//         }
//     }

//     async fetchPoolDiddy() {
//         try {
//             const currentRoundId = await this.getCurrentRoundId();
//             const previousRoundId = currentRoundId - 1;
//             const previousRound = await this.diddyModel.findOne({ roundId: previousRoundId }).lean();
//             let roundId = -1;

//             if (!previousRound) {
//                 roundId = currentRoundId;
//             }
//             else if (previousRound.status == DiddyStatus.DRAWING || previousRound.status == DiddyStatus.OPEN) {
//                 roundId = previousRoundId;
//             } else {
//                 roundId = currentRoundId;
//             }

//             const currentPool = await this.client.readContract({
//                 address: this.configService.get<string>('DIDDY_ADDRESS'),
//                 abi: DiddyABI,
//                 functionName: 'getRoundInfo',
//                 args: [roundId]
//             });

//             const carryOverReward = await this.client.readContract({
//                 address: this.configService.get<string>('DIDDY_ADDRESS'),
//                 abi: DiddyABI,
//                 functionName: 'carryOverReward',
//             });

//             this.logger.log(`${this.logPrefix} Current round ID Processed: ${roundId}`);
//             this.logger.log(`${this.logPrefix} Current pool: ${currentPool}`);

//             const status = currentPool[0];
//             const startTime = currentPool[1];
//             const endTime = currentPool[2];
//             const drawnAt = currentPool[3];
//             const numberOfPlayers = currentPool[4];
//             const safeRoom = currentPool[5];
//             const totalStaked = currentPool[6]
//             const totalWinnerStaked = currentPool[7];
//             const treasuryFeeAmount = currentPool[8];
//             const treasuryFeeProcessed = currentPool[9];

//             const roundPlayers = await this.client.readContract({
//                 address: this.configService.get<string>('DIDDY_ADDRESS'),
//                 abi: DiddyABI,
//                 functionName: 'getRoundPlayers',
//                 args: [roundId]
//             });

//             const players = roundPlayers[0];
//             const stakes = roundPlayers[1];
//             const roomNumbers = roundPlayers[2];

//             const participants = players.map((address, index) => ({
//                 address,
//                 deposit: stakes[index].toString(),
//                 roomNumber: Number(roomNumbers[index])
//             }));

//             let winners = [];
//             if (status === DiddyStatus.DRAWN) {
//                 // Xử lý trường hợp có người thắng
//                 if (Number(safeRoom) > 0) {
//                     const winningParticipants = participants.filter(participant =>
//                         participant.roomNumber === Number(safeRoom)
//                     );

//                     winners = winningParticipants.map(winner => ({
//                         address: winner.address,
//                         deposit: winner.deposit,
//                         claimed: false,
//                         txHash: '',
//                         claimedAt: 0
//                     }));
//                 }
//             } else if (status === DiddyStatus.CANCELLED) {
//                 winners = participants.map(participant => ({
//                     address: participant.address,
//                     deposit: participant.deposit,
//                     claimed: false,
//                     txHash: '',
//                     claimedAt: 0
//                 }));
//             }

//             if (status === DiddyStatus.CANCELLED || status === DiddyStatus.DRAWN) {
//                 await this.diddyModel.findOneAndUpdate({ roundId: roundId }, {
//                     status,
//                     startTime,
//                     endTime,
//                     drawnAt,
//                     numberOfPlayers: Number(numberOfPlayers),
//                     safeRoom: Number(safeRoom),
//                     totalValue: totalStaked.toString(),
//                     totalEntries: totalWinnerStaked.toString(),
//                     protocolFeeOwed: treasuryFeeAmount.toString(),
//                     winners,
//                     participants
//                 }, { upsert: true });
//             } else {
//                 await this.diddyModel.findOneAndUpdate({ roundId: roundId }, {
//                     status,
//                     startTime,
//                     endTime,
//                     drawnAt,
//                     numberOfPlayers: Number(numberOfPlayers),
//                     safeRoom: Number(safeRoom),
//                     totalValue: totalStaked.toString(),
//                     totalEntries: totalWinnerStaked.toString(),
//                     protocolFeeOwed: treasuryFeeAmount.toString(),
//                     winners,
//                     carryOverReward: carryOverReward.toString(),
//                     participants
//                 }, { upsert: true });
//             }



//             if (status === DiddyStatus.DRAWN && !this.processedWinners.has(roundId.toString()) && !this.isProcessingWinner) {
//                 this.logger.log(`${this.logPrefix} Round ${roundId} completed with safeRoom: ${safeRoom}`);
//             }

//             if (status === DiddyStatus.CANCELLED) {
//                 await this.handleCancelledRound(roundId.toString());
//             }

//             return true;
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error in fetchPoolDiddy:`, error);
//             throw error;
//         }
//     }

//     async fetchPoolDiddyByRoundId(roundId: string) {
//         const diddy = await this.diddyModel.findOne({ roundId: roundId }).lean();
//         return diddy;
//     }

//     async fetchAllPools(page: number, limit: number, address?: string) {
//         try {
//             const skip = (page - 1) * limit;
//             const filter = address ? { 'winners.address': address } : {};

//             const [data, total] = await Promise.all([
//                 this.diddyModel.aggregate([
//                     {
//                         $match: {
//                             ...filter,
//                             status: { $nin: [DiddyStatus.NONE, DiddyStatus.OPEN] }
//                         }
//                     },
//                     {
//                         $addFields: {
//                             roundIdNum: { $toInt: "$roundId" }
//                         }
//                     },
//                     { $sort: { roundIdNum: -1 } },
//                     { $skip: skip },
//                     { $limit: limit }
//                 ]),
//                 this.diddyModel.countDocuments(filter)
//             ]);

//             return {
//                 data,
//                 total
//             };
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error fetching all pools:`, error);
//             throw error;
//         }
//     }

//     async updateWinnerClaimed(roundId: string, txHash: string, userAddress: string) {
//         try {
//             const round = await this.diddyModel.findOne({ roundId }).lean();
//             if (!round) {
//                 throw new Error(`Round ${roundId} does not exist`);
//             }

//             if (round.status !== DiddyStatus.DRAWN && round.status !== DiddyStatus.CANCELLED) {
//                 throw new Error(`Round ${roundId} has not ended or does not have a winner`);
//             }

//             // Verify transaction
//             // const tx = await this.client.getTransactionReceipt({ hash: txHash });
//             // if (!tx || !tx.status) {
//             //     throw new Error('Transaction failed');
//             // }

//             // Find winner in winners array
//             const winnerIndex = round.winners.findIndex(w => w.address === userAddress);
//             if (winnerIndex === -1) {
//                 throw new Error(`You are not a winner of round ${roundId}`);
//             }

//             if (round.winners[winnerIndex].claimed) {
//                 throw new Error(`Prize already claimed for round ${roundId}`);
//             }

//             // Calculate prize amount
//             const prizeAmount = await this.calculatePrize(roundId, userAddress, round.status);

//             // Update claimed status for the winner
//             const updatedWinners = [...round.winners];
//             updatedWinners[winnerIndex] = {
//                 ...updatedWinners[winnerIndex],
//                 claimed: true,
//                 txHash,
//                 claimedAt: Math.floor(Date.now() / 1000)
//             };

//             // Check if all winners have claimed
//             const allWinnersClaimed = updatedWinners.every(w => w.claimed);

//             await this.diddyModel.findOneAndUpdate(
//                 { roundId },
//                 {
//                     winners: updatedWinners,
//                     allWinnersClaimed
//                 }
//             );

//             return {
//                 success: true,
//                 message: 'Successfully updated claim status',
//                 prizeAmount
//             };
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error updating winner claimed status: ${error.message}`);
//             throw error;
//         }
//     }

//     async getHistory(address: string) {
//         try {
//             const rounds = await this.diddyModel.find({
//                 'participants.address': address,
//                 status: { $nin: [DiddyStatus.NONE, DiddyStatus.OPEN] }
//             })
//                 .sort({ roundId: -1 })
//                 .lean();

//             const history = rounds.map(round => {
//                 const participant = round.participants.find(p => p.address === address);
//                 const isWinner = round.winners.some(w => w.address === address);
//                 const winner = isWinner ? round.winners.find(w => w.address === address) : null;

//                 return {
//                     roundId: round.roundId,
//                     status: round.status,
//                     startTime: round.startTime,
//                     endTime: round.endTime,
//                     drawnAt: round.drawnAt,
//                     deposit: participant?.deposit,
//                     roomNumber: participant?.roomNumber,
//                     isWinner,
//                     prizeAmount: winner ? this.calculatePrize(round.roundId.toString(), address, round.status) : '0',
//                     claimed: winner ? winner.claimed : false,
//                     txHash: winner ? winner.txHash : '',
//                     claimedAt: winner ? winner.claimedAt : 0,
//                     totalValue: round.totalValue,
//                     numberOfPlayers: round.numberOfPlayers,
//                     safeRoom: round.safeRoom
//                 };
//             });

//             return history;
//         } catch (error) {
//             this.logger.error(`${this.logPrefix} Error fetching user history: ${error.message}`);
//             throw error;
//         }
//     }
// } 