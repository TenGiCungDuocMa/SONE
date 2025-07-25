import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { KuroService } from '../kuro/kuro.service';
import { DiddyService } from '../diddy/diddy.service';
import { OnEvent } from '@nestjs/event-emitter';
import { JackpotService } from 'src/jackpot/jackpot.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(SocketGateway.name);
    private connectedClients: Map<string, Socket> = new Map();

    constructor(
        private readonly kuroService: KuroService,
        private readonly diddyService: DiddyService,
        private readonly jackpotService: JackpotService
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway đã được khởi tạo');

        this.setupKuroServiceListeners();
        this.setupDiddyServiceListeners();
        
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);

        this.sendLatestData(client);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    /**
     * Lắng nghe sự kiện người thắng được công bố từ Kuro
     */
    @OnEvent('kuro.winner_announced')
    handleWinnerAnnounced(payload: any) {
        this.logger.log(`Winner announced event received for round ${payload.roundId}: ${payload.winner}`);

        this.server.emit('winnerAnnounced', {
            event: 'winnerAnnounced',
            data: payload,
            showDuration: 15000,
            timestamp: Date.now()
        });
    }

    /**
     * Lắng nghe sự kiện vòng mới từ Kuro
     */
    @OnEvent('kuro.new_round')
    handleNewRound(payload: any) {
        this.logger.log(`New round event received: ${payload.roundId}`);

        this.server.emit('newRound', {
            event: 'newRound',
            data: payload,
            timestamp: Date.now()
        });
    }

    /**
     * Lắng nghe sự kiện người thắng được công bố từ Diddy
     */
    @OnEvent('diddy.winner_announced')
    handleDiddyWinnerAnnounced(payload: any) {
        this.logger.log(`Diddy winner announced event received for round ${payload.roundId}: ${JSON.stringify(payload)}`);
        this.server.emit('diddyWinnerAnnounced', {
            event: 'diddyWinnerAnnounced',
            data: payload,
            showDuration: 15000,
            timestamp: Date.now()
        });
    }

    /**
     * Lắng nghe sự kiện vòng mới từ Diddy
     */
    @OnEvent('diddy.new_round')
    handleDiddyNewRound(payload: any) {
        this.logger.log(`Diddy new round event received: ${payload.roundId}`);

        this.server.emit('diddyNewRound', {
            event: 'diddyNewRound',
            data: payload,
            timestamp: Date.now()
        });
    }

    /**
     * Lắng nghe sự kiện vòng bị hủy từ Diddy
     */
    @OnEvent('diddy.round_cancelled')
    handleDiddyRoundCancelled(payload: any) {
        this.logger.log(`Diddy round cancelled event received: ${payload.roundId}`);

        this.server.emit('diddyRoundCancelled', {
            event: 'diddyRoundCancelled',
            data: payload,
            timestamp: Date.now()
        });
    }

    @OnEvent('jackpot_round_updated')
    handleJackpotRoundUpdated(payload: any) {
        this.logger.log(`Jackpot round updated event received: ${JSON.stringify(payload)}`);
        this.server.emit('jackpotRoundUpdated', payload);
    }

    @OnEvent('jackpot_announced_winner')
    handleJackpotAnnouncedWinner(payload: any) {
        this.logger.log(`Jackpot announced winner event received: ${JSON.stringify(payload)}`);
        this.server.emit('jackpotWinnerAnnounced', payload);
    }

    /**
     * Thiết lập lắng nghe sự kiện từ KuroService
     */
    private setupKuroServiceListeners() {
        setInterval(async () => {
            try {
                this.broadcastLatestKuroData();
            } catch (error) {
                this.logger.error(`Error broadcasting Kuro data: ${error.message}`);
            }
        }, 5000);
    }

    /**
     * Thiết lập lắng nghe sự kiện từ DiddyService
     */
    private setupDiddyServiceListeners() {
        setInterval(async () => {
            try {
                this.broadcastLatestDiddyData();
            } catch (error) {
                this.logger.error(`Error broadcasting Diddy data: ${error.message}`);
            }
        }, 5000);
    }

    private setUpJackpotListeners() {
            try {
                const jackpotData = this.jackpotService.lastedPoolData();
                this.server.emit('jackpotRoundUpdated', jackpotData);
            } catch (error) {
                this.logger.error(`Error broadcasting Jackpot data: ${error.message}`);
            }
    }

    /**
     * Gửi dữ liệu mới nhất cho client khi họ kết nối
     */
    private async sendLatestData(client: Socket) {
        try {
            const latestKuroData = await this.kuroService.getLatestKuroData();
            const latestDiddyData = await this.diddyService.getLatestDiddyData();
            const latestJackpotData = await this.jackpotService.lastedPoolData();

            client.emit('kuroUpdate', latestKuroData);
            client.emit('diddyUpdate', latestDiddyData);
            client.emit('jackpotRoundUpdated', latestJackpotData);
        } catch (error) {
            this.logger.error(`Error sending latest data to client: ${error.message}`);
        }
    }

    /**
     * Gửi dữ liệu mới nhất đến tất cả clients đang kết nối
     */
    private async broadcastLatestKuroData() {
        try {
            const latestKuroData = await this.kuroService.getLatestKuroData();
            this.server.emit('kuroUpdate', latestKuroData);
        } catch (error) {
            this.logger.error(`Error broadcasting Kuro data: ${error.message}`);
        }
    }

    /**
     * Gửi dữ liệu Diddy mới nhất đến tất cả clients đang kết nối
     */
    private async broadcastLatestDiddyData() {
        try {
            const latestDiddyData = await this.diddyService.getLatestDiddyData();
            this.server.emit('diddyUpdate', latestDiddyData);
        } catch (error) {
            this.logger.error(`Error broadcasting Diddy data: ${error.message}`);
        }
    }

    @SubscribeMessage('subscribeToRound')
    handleSubscribeToRound(client: Socket, roundId: number) {
        this.logger.log(`Client ${client.id} subscribed to round ${roundId}`);
        client.join(`round-${roundId}`);
        return { event: 'subscribeToRound', data: { success: true, roundId } };
    }

    @SubscribeMessage('subscribeToDiddyRound')
    handleSubscribeToDiddyRound(client: Socket, roundId: number) {
        this.logger.log(`Client ${client.id} subscribed to Diddy round ${roundId}`);
        client.join(`diddy-round-${roundId}`);
        return { event: 'subscribeToDiddyRound', data: { success: true, roundId } };
    }
} 