import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { KuroABI } from 'src/abi/KuroABI-old';
import { createPublicClient, createWalletClient, http, formatEther,defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Enum matching the contract
enum RoundStatus {
    None,
    Open,
    Drawing,
    Drawn,
    Cancelled
}

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
export class DrawWinnerKeeperService implements OnModuleInit {
    private readonly logger = new Logger(DrawWinnerKeeperService.name);
    private client: any;
    private walletClient: any;
    private account: any;

    // Add a variable to track if a transaction is pending
    private transactionInProgress = false;
    // Add a variable to track if a precise check is scheduled
    private preciseCheckScheduled = false;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        this.logger.log('[KEEPER_KURO] Initializing DrawWinnerKeeperService');

        // Get configuration from environment variables
        const privateKeyRaw = this.configService.get<string>('KEEPER_PRIVATE_KEY');
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const kuryoAddress = this.configService.get<string>('KURO_ADDRESS');
        const chainId = Number(this.configService.get<string>('CHAIN_ID') || '10143'); // Somnia testnet

        if ( !privateKeyRaw || !kuryoAddress) {
            this.logger.error('Missing environment variables for keeper. Check KEEPER_PRIVATE_KEY and KURO_ADDRESS.');
            return;
        }

        if (!rpcUrl) {
            throw new Error('SOMNIA_RPC_URL is not defined');
        }

        // Format private key correctly
        const privateKey = privateKeyRaw?.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`;

        // Setup account
        this.account = privateKeyToAccount(privateKey as `0x${string}`);
        const transport = http(rpcUrl);

        // Define Monad testnet chain
        const somniaTestnet = defineChain({
            id: chainId,
            name: 'Somnia Testnet',
            network: 'somniaTestnet',
            // network: 'localhost',
            nativeCurrency: {
                decimals: 18,
                name: 'Somnia',
                symbol: 'STT',
            },
            rpcUrls: {
                default: {
                http: [rpcUrl], 
                },
                public: {
                http: [rpcUrl],
                },
            },
        });

        // Create clients
        this.client = createPublicClient({
            chain: somniaTestnet,
            transport,
        });

        this.walletClient = createWalletClient({
            account: this.account,
            chain: somniaTestnet,
            transport,
        });

        this.logger.log(`[KEEPER_KURO] Keeper service initialized with account: ${this.account.address}`);

        // Check account balance on initialization
        try {
            const balance = await this.client.getBalance({
                address: this.account.address,
            });

            this.logger.log(`[KEEPER_KURO] Keeper wallet balance: ${formatEther(balance)} STT`);

            // If balance is very low, log a warning
            if (balance < BigInt(10000000000000000)) { // 0.01 STT
                this.logger.warn(`[KEEPER_KURO] Low keeper wallet balance! Current balance: ${formatEther(balance)} STT`);
                this.logger.warn(`[KEEPER_KURO] Please fund the account ${this.account.address} with some STT for gas fees.`);
            }
        } catch (error) {
            this.logger.error(`[KEEPER_KURO] Error checking keeper wallet balance: ${error.message}`);
        }
    }

    // Run every 10 seconds
    @Cron('*/10 * * * * *')
    async checkAndDrawWinner() {
        if (this.transactionInProgress) {
            this.logger.debug('[KEEPER_KURO] Transaction in progress, skipping check...');
            return;
        }

        try {
            this.transactionInProgress = true;
            this.logger.log('[KEEPER_KURO] Checking if a winner needs to be drawn...');

            const kuryoAddress = this.configService.get<string>('KURO_ADDRESS');
            this.logger.debug(`[KEEPER_KURO] Using contract address: ${kuryoAddress}`);

            // Get current block information
            try {
                const blockNumber = await this.client.getBlockNumber();
                const block = await this.client.getBlock({ blockNumber });
                this.logger.log(`[KEEPER_KURO] Current block: ${blockNumber}, timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
            } catch (error) {
                this.logger.warn(`[KEEPER_KURO] Could not get block info: ${error.message}`);
            }

            // Get current round ID
            const currentRoundId = await this.client.readContract({
                address: kuryoAddress as `0x${string}`,
                abi: KuroABI,
                functionName: 'currentRoundId',
            });

            this.logger.log(`[KEEPER_KURO] Current round ID: ${currentRoundId}`);

            // Get round info
            const roundInfo = await this.client.readContract({
                address: kuryoAddress as `0x${string}`,
                abi: KuroABI,
                functionName: 'getRoundInfo',
                args: [currentRoundId],
            });

            const [status, startTime, endTime, , numberOfParticipants] = roundInfo as unknown as readonly [number, number, number, number, number, `0x${string}`, bigint, bigint, bigint];

            // Get additional round information for debugging
            try {
                const totalDeposits = await this.client.readContract({
                    address: kuryoAddress as `0x${string}`,
                    abi: KuroABI,
                    functionName: 'getTotalDeposits',
                    args: [currentRoundId],
                });

                const winner = await this.client.readContract({
                    address: kuryoAddress as `0x${string}`,
                    abi: KuroABI,
                    functionName: 'getWinner',
                    args: [currentRoundId],
                });

                this.logger.log(`[KEEPER_KURO] Total Deposits: ${formatEther(totalDeposits as bigint)} STT`);
                this.logger.log(`[KEEPER_KURO] Winner Address: ${winner}`);
            } catch (error) {
                this.logger.debug(`[KEEPER_KURO] Could not get additional round info: ${error.message}`);
            }

            const now = Math.floor(Date.now() / 1000);
            const isOpen = status === RoundStatus.Open;
            const endTimeSet = Number(endTime) > 0;
            const isPastEndTime = endTimeSet && now >= Number(endTime);
            const hasMinimumPlayers = Number(numberOfParticipants) >= 2;

            // Log detailed round information
            this.logger.log(`[KEEPER_KURO] Round Status: ${status} (${RoundStatus[status]})`);
            this.logger.log(`[KEEPER_KURO] Start Time: ${new Date(Number(startTime) * 1000).toISOString()}`);
            this.logger.log(`[KEEPER_KURO] End Time: ${endTimeSet ? new Date(Number(endTime) * 1000).toISOString() : 'Not set'}`);
            this.logger.log(`[KEEPER_KURO] Current Time: ${new Date(now * 1000).toISOString()}`);
            this.logger.log(`[KEEPER_KURO] Number of Participants: ${numberOfParticipants}`);
            this.logger.log(`[KEEPER_KURO] Conditions check:`);
            this.logger.log(`[KEEPER_KURO] - Is Open: ${isOpen}`);
            this.logger.log(`[KEEPER_KURO] - End Time Set: ${endTimeSet}`);
            this.logger.log(`[KEEPER_KURO] - Is Past End Time: ${isPastEndTime}`);
            this.logger.log(`[KEEPER_KURO] - Has Minimum Players: ${hasMinimumPlayers}`);

            if (isOpen && endTimeSet && isPastEndTime && hasMinimumPlayers) {
                this.logger.log('[KEEPER_KURO] ✅ All conditions met! Round is ready for winner drawing!');
                this.logger.log('[KEEPER_KURO] Checking account balance...');

                const balance = await this.client.getBalance({
                    address: this.account.address,
                });

                const minimumBalance = BigInt(10000000000000000);

                this.logger.log(`[KEEPER_KURO] Current balance: ${formatEther(balance)} MON`);
                this.logger.log(`[KEEPER_KURO] Minimum required balance: ${formatEther(minimumBalance)} MON`);

                if (balance < minimumBalance) {
                    this.logger.error(`[KEEPER_KURO] ❌ Insufficient balance to pay for gas!`);
                    this.logger.error(`[KEEPER_KURO] Current balance: ${formatEther(balance)} MON`);
                    this.logger.error(`[KEEPER_KURO] Please fund the account ${this.account.address} with some MON for gas fees.`);
                    return;
                }

                this.logger.log(`[KEEPER_KURO] ✅ Account balance sufficient: ${formatEther(balance)} MON. Enough for ~${Number(balance / minimumBalance)} more rounds.`);

                try {
                    this.logger.log('[KEEPER_KURO] 🚀 Attempting to call drawWinner function...');

                    // Estimate gas first
                    try {
                        const gasEstimate = await this.client.estimateContractGas({
                            address: kuryoAddress as `0x${string}`,
                            abi: KuroABI,
                            functionName: 'drawWinner',
                        });
                        this.logger.log(`[KEEPER_KURO] Gas estimate: ${gasEstimate}`);
                    } catch (gasError) {
                        this.logger.warn(`[KEEPER_KURO] Could not estimate gas: ${gasError.message}`);
                    }

                    // Get current nonce
                    try {
                        const nonce = await this.client.getTransactionCount({
                            address: this.account.address,
                        });
                        this.logger.log(`[KEEPER_KURO] Current nonce: ${nonce}`);
                    } catch (nonceError) {
                        this.logger.warn(`[KEEPER_KURO] Could not get nonce: ${nonceError.message}`);
                    }

                    const hash = await this.walletClient.writeContract({
                        address: kuryoAddress as `0x${string}`,
                        abi: KuroABI,
                        functionName: 'drawWinner',
                    });

                    this.logger.log(`[KEEPER_KURO] ✅ Winner drawn! Transaction hash: ${hash}`);

                    this.logger.log('[KEEPER_KURO] Waiting for transaction confirmation...');
                    const receipt = await this.client.waitForTransactionReceipt({ hash });
                    this.logger.log(`[KEEPER_KURO] ✅ Transaction confirmed! Block: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed}`);

                    // Log transaction status
                    if (receipt.status === 'success') {
                        this.logger.log('[KEEPER_KURO] ✅ Transaction successful!');
                    } else {
                        this.logger.error('[KEEPER_KURO] ❌ Transaction failed!');
                    }
                } catch (error) {
                    this.logger.error(`[KEEPER_KURO] ❌ Error drawing winner:`, error);

                    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
                        this.logger.error(`[KEEPER_KURO] Error message: ${error.message}`);

                        if (error.message.includes("Winner already drawn for this round")) {
                            this.logger.warn('[KEEPER_KURO] ⚠️ Winner was already drawn for this round');
                        } else if (error.message.includes("Round is not open")) {
                            this.logger.warn('[KEEPER_KURO] ⚠️ Round is not open');
                        } else if (error.message.includes("Round has not ended")) {
                            this.logger.warn('[KEEPER_KURO] ⚠️ Round has not ended yet');
                        } else if (error.message.includes("Not enough participants")) {
                            this.logger.warn('[KEEPER_KURO] ⚠️ Not enough participants');
                        } else if (error.message.includes("insufficient funds")) {
                            this.logger.error('[KEEPER_KURO] ❌ Insufficient funds for gas');
                        } else if (error.message.includes("nonce")) {
                            this.logger.error('[KEEPER_KURO] ❌ Nonce error - transaction may be stuck');
                        } else {
                            this.logger.error(`[KEEPER_KURO] ❌ Unknown contract error: ${error.message}`);
                        }
                    } else {
                        this.logger.error('[KEEPER_KURO] ❌ Unknown error type:', error);
                    }
                }
            } else if (isOpen && isPastEndTime && !hasMinimumPlayers) {
                this.logger.warn('[KEEPER_KURO] ⚠️ End time passed but not enough participants');
                this.logger.warn(`[KEEPER_KURO] Number of participants: ${numberOfParticipants} (minimum required: 2)`);
                this.logger.warn('[KEEPER_KURO] Cancelling round...');

                try {
                    const hash = await this.walletClient.writeContract({
                        address: kuryoAddress as `0x${string}`,
                        abi: KuroABI,
                        functionName: 'cancel',
                    });

                    this.logger.log(`[KEEPER_KURO] ✅ Round cancelled! Transaction hash: ${hash}`);

                    const receipt = await this.client.waitForTransactionReceipt({ hash });
                    this.logger.log(`[KEEPER_KURO] ✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
                } catch (error) {
                    this.logger.error(`[KEEPER_KURO] ❌ Error cancelling round:`, error);
                }
            } else {
                // Log why conditions are not met
                this.logger.debug('[KEEPER_KURO] Conditions not met for drawing winner:');
                if (!isOpen) {
                    this.logger.debug(`[KEEPER_KURO] - Round is not open (status: ${status})`);
                }
                if (!endTimeSet) {
                    this.logger.debug('[KEEPER_KURO] - End time is not set');
                }
                if (!isPastEndTime) {
                    this.logger.debug(`[KEEPER_KURO] - Round has not ended yet (current: ${now}, end: ${Number(endTime)})`);
                }
                if (!hasMinimumPlayers) {
                    this.logger.debug(`[KEEPER_KURO] - Not enough participants (${numberOfParticipants} < 2)`);
                }
            }
        } catch (error) {
            this.logger.error(`[KEEPER_KURO] ❌ Error in keeper script:`, error);
            this.logger.error(`[KEEPER_KURO] Error stack:`, error.stack);
        } finally {
            this.transactionInProgress = false;
        }
    }
}