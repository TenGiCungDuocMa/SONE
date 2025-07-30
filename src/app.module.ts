import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PointService } from './point/point.service';
import { PointModule } from './point/point.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomHeaderMiddleware } from './middleware/CustomHeaderMiddleware';
import { SharedModelModule } from './shared/shared-model.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './services/JwtStrategy';
import { KuroModule } from './kuro/kuro.module';
import { SocketModule } from './socket/socket.module';
import { JackpotModule } from './jackpot/jackpot.module';
import { KeeperModule } from './keeper/keeper.module';
@Module({
  imports: [AuthModule, PointModule,SharedModelModule,
    ConfigModule.forRoot({isGlobal: true, envFilePath: ['.env']}),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
    KeeperModule,
    KuroModule,
    SocketModule,
    JackpotModule,
  ],
  controllers: [AppController],
  providers: [AppService, PointService, JwtStrategy],
})
export class AppModule implements OnModuleInit {

  async onModuleInit() {

  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CustomHeaderMiddleware)
      .forRoutes("*");
  }
}
