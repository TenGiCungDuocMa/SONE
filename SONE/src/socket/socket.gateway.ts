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
import { OnEvent } from '@nestjs/event-emitter';

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
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway đã được khởi tạo');
        this.setupKuroServiceListeners();
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
     * Gửi dữ liệu mới nhất cho client khi họ kết nối
     */
    private async sendLatestData(client: Socket) {
        try {
            const latestKuroData = await this.kuroService.getLatestKuroData();
            client.emit('kuroUpdate', latestKuroData);
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

    // chỉ định tên sự kiện mà server sẽ lắng nghe từ client
    @SubscribeMessage('subscribeToRound')
    handleSubscribeToRound(client: Socket, roundId: number) {
        this.logger.log(`Client ${client.id} subscribed to round ${roundId}`);
        client.join(`round-${roundId}`);
        return { event: 'subscribeToRound', data: { success: true, roundId } };
    }
} 