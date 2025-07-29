import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SoneABI } from "src/abi/SoneABI";
import { Kuro } from "src/shared/schemas/kuro.schema";
import { http } from "viem";
import { createPublicClient } from "viem";

type UserDeposit = {
    address: string;
    deposits: {
        amount: string;
        tokenAddress: string;
    }[];
};

/**
 * Hàm tiện ích để chuẩn bị đối tượng chứa BigInt cho JSON.stringify
 * Chuyển đổi tất cả các giá trị BigInt thành chuỗi
 */
function prepareBigIntForJSON(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(prepareBigIntForJSON);
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = prepareBigIntForJSON(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

@Injectable()
export class DepositTrackerService {
    private readonly logger = new Logger(DepositTrackerService.name)
    private readonly client: any

    constructor(
        @InjectModel(Kuro.name) private kuroModel: Model<Kuro>,
        private readonly configService: ConfigService,
    ) {
        const rpcUrl = <string>this.configService.get<string>('RPC_URL');
        const chainId = parseInt(<string>this.configService.get('CHAIN_ID'));

        this.client = createPublicClient({
            chain: {
                id: chainId,
                name: 'Somnia Testnet',
                rpcUrls: {
                    default: {
                        http: [rpcUrl],
                        webSocket: [rpcUrl.replace('http', 'ws')]
                    }
                },
                nativeCurrency: {
                    name: 'Somnia',
                    symbol: 'STT',
                    decimals: 18
                }
            },
            transport: http(),
        });
    }

    async trackDeposit(roundId: number) {
        const currentRoundData = await this.client.readContract({
            address: this.configService.get<string>('SONE_ADDRESS'),
            abi: SoneABI,
            functionName: 'getUserDepositsInRound',
            args: [roundId],
        });

        this.logger.log(`[DEPOSIT_TRACKER] Current round data: ${JSON.stringify(prepareBigIntForJSON(currentRoundData))}`);

        const userDeposits: UserDeposit[] = [];

        for (const item of currentRoundData) {
            const address = item.userAddress;
            const deposits = item.deposits;

            userDeposits.push({
                address: address,
                deposits: deposits.map((deposit: any) => ({
                    amount: deposit.amount.toString(),
                    tokenAddress: deposit.tokenAddress.toString(),
                }))
            });
        }

        return userDeposits;
    }
}