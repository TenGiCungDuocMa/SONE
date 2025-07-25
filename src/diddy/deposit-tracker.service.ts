import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http } from 'viem';
import { DiddyABI } from 'src/abi/DiddyABI';
import { DiddyStatus } from '../shared/schemas/diddy.schema';

interface Participant {
    address: string;
    deposit: string;
}

@Injectable()
export class DepositTrackerService {
    private readonly logger = new Logger(DepositTrackerService.name);
    private client: any;

    constructor(private configService: ConfigService) {
        const rpcUrl = <string>this.configService.get<string>('RPC_URL');
        const chainId = parseInt(<string>this.configService.get('CHAIN_ID'));

        this.client = createPublicClient({
            chain: {
                id: chainId,
                name: 'Monad Testnet',
                rpcUrls: {
                    default: { http: [rpcUrl] }
                },
                nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MON',
                    decimals: 18
                }
            },
            transport: http(),
        });
    }

    async trackDeposit(roundId: number) {
        try {
            // Lấy thông tin round
            const roundInfo = await this.client.readContract({
                address: this.configService.get<string>('DIDDY_ADDRESS'),
                abi: DiddyABI,
                functionName: 'getRoundPlayers',
                args: [roundId]
            });

            const [status, , , numberOfParticipants, winner, totalValue, totalEntries] = roundInfo;

            // Nếu round không tồn tại hoặc đã bị hủy, trả về mảng rỗng
            if (status === DiddyStatus.NONE || status === DiddyStatus.CANCELLED) {
                this.logger.warn(`Round ${roundId} does not exist or has been cancelled`);
                return [];
            }

            const participants : Participant[] = [];

            // Nếu có người thắng và round đã kết thúc
            if (winner && winner !== '0x0000000000000000000000000000000000000000' && status === DiddyStatus.DRAWN) {
                // Tính toán số tiền thắng dựa trên tỷ lệ
                const winnerShare = (totalValue * BigInt(1)) / totalEntries;

                participants.push({
                    address: winner,
                    deposit: winnerShare.toString()
                    
                });
            }

            return participants;
        } catch (error) {
            this.logger.error(`Error tracking deposits for round ${roundId}: ${error.message}`);
            return [];
        }
    }

    async getRoundPlayers(roundId: number) {
        try {
            const players = await this.client.readContract({
                address: this.configService.get<string>('DIDDY_ADDRESS'),
                abi: DiddyABI,
                functionName: 'getRoundPlayers',
                args: [roundId]
            });

            return {
                players: players[0],
                stakes: players[1],
                roomNumbers: players[2]
            };
        } catch (error) {
            this.logger.error(`Error getting round players for round ${roundId}: ${error.message}`);
            return { players: [], stakes: [], roomNumbers: [] };
        }
    }

    async getRoomStakes(roundId: number) {
        try {
            const stakes = await this.client.readContract({
                address: this.configService.get<string>('DIDDY_ADDRESS'),
                abi: DiddyABI,
                functionName: 'getRoomStakes',
                args: [roundId]
            });

            return stakes;
        } catch (error) {
            this.logger.error(`Error getting room stakes for round ${roundId}: ${error.message}`);
            return [];
        }
    }
}
