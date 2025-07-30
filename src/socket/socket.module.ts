import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { KuroModule } from '../kuro/kuro.module';

@Module({
    imports: [KuroModule,],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule { } 