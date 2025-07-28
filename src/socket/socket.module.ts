import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { KuroModule } from '../kuro/kuro.module';
// import { DiddyModule } from '../diddy/diddy.module';
import { JackpotModule } from 'src/jackpot/jackpot.module';

@Module({
    imports: [KuroModule, JackpotModule],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule { } 