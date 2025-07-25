import { WebSocketGateway } from '@nestjs/websockets';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class SocketGateway {
  constructor(private readonly socketService: SocketService) {}
}
