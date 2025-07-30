import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeeperModule } from './keeper/keeper.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: ['.env']}),
    KeeperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
