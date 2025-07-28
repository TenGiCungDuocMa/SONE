import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DiddyABI } from 'src/abi/DiddyABI';
import { createPublicClient, createWalletClient, http, formatEther, defineChain } from 'viem';
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
export class DrawWinnerHideKeeperService implements OnModuleInit {
    private readonly logger = new Logger(DrawWinnerHideKeeperService.name);
    private client: any;
    private walletClient: any;
    private account: any;

    // Add a variable to track if a transaction is pending
    private transactionInProgress = false;
    // Add a variable to track if a precise check is scheduled
    private preciseCheckScheduled = false;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        this.logger.log('Initializing DrawWinnerHideKeeperService');

        // Get configuration from environment variables
        const privateKeyRaw = this.configService.get<string>('KEEPER_PRIVATE_KEY_DIDDY');
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const diddyAddress = this.configService.get<string>('DIDDY_ADDRESS');
        const chainId = Number(this.configService.get<string>('CHAIN_ID') || '10143'); // Monad testnet

        if (!privateKeyRaw || !diddyAddress) {
            this.logger.error('Missing environment variables for keeper. Check KEEPER_PRIVATE_KEY_DIDDY and DIDDY_ADDRESS.');
            return;
        }
        if (!rpcUrl) {
            throw new Error('Somnia_RPC_URL is not defined');
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

        this.logger.log(`Keeper service initialized with account: ${this.account.address}`);

        // Check account balance on initialization
        try {
            const balance = await this.client.getBalance({
                address: this.account.address,
            });

            this.logger.log(`Keeper wallet balance: ${formatEther(balance)} STT`);

            // If balance is very low, log a warning
            if (balance < BigInt(10000000000000000)) { // 0.01 STT
                this.logger.warn(`Low keeper wallet balance! Current balance: ${formatEther(balance)} STT`);
                this.logger.warn(`Please fund the account ${this.account.address} with some STT for gas fees.`);
            }
        } catch (error) {
            this.logger.error(`Error checking keeper wallet balance: ${error.message}`);
        }
    }

    // Run every 30 seconds
    @Cron('*/30 * * * * *')
    async checkAndDrawHide() {
        // Skip this check if a transaction is already in progress
        if (this.transactionInProgress) {
            this.logger.debug('⏳ Transaction in progress, skipping check...');
            return;
        }

        try {
            this.transactionInProgress = true;
            this.logger.log('🔍 Checking if a hide needs to be drawn...');

            const diddyAddress = this.configService.get<string>('DIDDY_ADDRESS');

            // Get current round ID
            const currentRoundId = await this.client.readContract({
                address: diddyAddress as `0x${string}`,
                abi: DiddyABI,
                functionName: 'currentRoundId',
            });

            this.logger.debug(`Current round ID: ${currentRoundId}`);

            // Get round info
            const roundInfo = await this.client.readContract({
                address: diddyAddress as `0x${string}`,
                abi: DiddyABI,
                functionName: 'getRoundInfo',
                args: [currentRoundId],
            });

            const [status, startTime, endTime, , numberOfParticipants] = roundInfo as unknown as readonly [number, number, number, number, number, `0x${string}`, bigint, bigint, bigint];

            // Check if round is Open and past end time
            const now = Math.floor(Date.now() / 1000);
            const isOpen = status === RoundStatus.Open;
            const endTimeSet = Number(endTime) > 0;
            const isPastEndTime = endTimeSet && now >= Number(endTime);
            const hasMinimumPlayers = Number(numberOfParticipants) >= 2; // MINIMUM_PLAYERS_FOR_VALID_ROUND

            this.logger.debug(`Round status: ${RoundStatus[status]}`);

            // Chuyển đổi các giá trị BigInt để có thể sử dụng JSON.stringify
            this.logger.debug(`Round info: ${JSON.stringify(prepareBigIntForJSON(roundInfo))}`);

            // If end time is set, end time has passed, and we have enough players
            if (isOpen && endTimeSet && isPastEndTime && hasMinimumPlayers) {
                this.logger.log('✅ Round is ready for hide drawing! Checking account balance...');

                // Check account balance before attempting transaction
                const balance = await this.client.getBalance({
                    address: this.account.address,
                });

                // Set minimum required balance (0.01 MON) per rounds for gas fees
                const minimumBalance = BigInt(10000000000000000);

                if (balance < minimumBalance) {
                    this.logger.error(`❌ Insufficient balance to pay for gas!`);
                    this.logger.error(`Current balance: ${formatEther(balance)} MON`);
                    this.logger.error(`Please fund the account ${this.account.address} with some MON for gas fees.`);
                    return; // Exit function early
                }

                this.logger.log(`Account balance: ${formatEther(balance)} MON. Enough for ~${Number(balance / minimumBalance)} more rounds.`);

                try {
                    // Draw hide
                    const hash = await this.walletClient.writeContract({
                        address: diddyAddress as `0x${string}`,
                        abi: DiddyABI,
                        functionName: 'drawSafeRoom',
                    });

                    this.logger.log(`🎉 Hide drawn! Transaction hash: ${hash}`);

                    // Wait for transaction to be mined
                    await this.client.waitForTransactionReceipt({ hash });
                    this.logger.log('Transaction confirmed!');
                } catch (error) {
                    // Check if error is an object with a message property
                    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
                        if (error.message.includes("Hide already drawn for this round")) {
                            this.logger.warn('⚠️ Hide was already drawn for this round');
                        } else {
                            this.logger.error(`Error drawing hide: ${error.message}`);
                        }
                    } else {
                        // Handle case where error doesn't have expected structure
                        this.logger.error('Unknown error type:', error);
                    }
                }
            } else if (isOpen && !endTimeSet) {
                this.logger.debug('⏳ Waiting for round to be initialized with a start and end time...');
            } else if (isOpen && endTimeSet && !isPastEndTime) {
                const timeRemaining = Math.max(0, Number(endTime) - now);
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                this.logger.debug(`⏳ Time remaining: ${minutes}m ${seconds}s`);

                // Make sure we only schedule one precise check
                if (timeRemaining > 0 && timeRemaining <= 30 && !this.preciseCheckScheduled) {
                    this.preciseCheckScheduled = true;
                    this.logger.log(`⏱️ End time approaching! Scheduling precise check in ${timeRemaining + 5} seconds`);

                    setTimeout(() => {
                        this.logger.log('🔔 Performing scheduled check after end time...');
                        this.preciseCheckScheduled = false; // Reset the flag
                        this.checkAndDrawHide();
                    }, (timeRemaining + 5) * 1000);
                }
            } else if (isOpen && isPastEndTime && !hasMinimumPlayers) {
                this.logger.warn('⚠️ End time passed but not enough participants');
                this.logger.warn(`Number of participants: ${numberOfParticipants}`);
                this.logger.warn(`Cancelling round...`);

                // Cancel round
                const hash = await this.walletClient.writeContract({
                    address: diddyAddress as `0x${string}`,
                    abi: DiddyABI,
                    functionName: 'cancel',
                });

                this.logger.log(`🙅‍♂️ Round cancelled! Transaction hash: ${hash}`);

                // Wait for transaction to be mined
                await this.client.waitForTransactionReceipt({ hash });
                this.logger.log('Transaction confirmed!');
            }
        } catch (error) {
            this.logger.error(`Error in keeper script: ${error.message}`);
        } finally {
            // Always reset the transaction in progress flag when done
            this.transactionInProgress = false;
        }
    }
}
