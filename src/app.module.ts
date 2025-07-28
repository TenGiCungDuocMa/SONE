import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ReferralController } from './referral/referral.controller';
import { ReferralService } from './referral/referral.service';
import { ReferralModule } from './referral/referral.module';
import { PointService } from './point/point.service';
import { PointModule } from './point/point.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomHeaderMiddleware } from './middleware/CustomHeaderMiddleware';
import { SharedModelModule } from './shared/shared-model.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './services/JwtStrategy';
// import { UserModule } from './user/user.module';
import { KuroModule } from './kuro/kuro.module';
import { SocketModule } from './socket/socket.module';
import { JackpotModule } from './jackpot/jackpot.module';
import { DiddyModule } from './diddy/diddy.module';
import { KeeperModule } from './keeper/keeper.module';

@Module({
  imports: [AuthModule, ReferralModule, PointModule,SharedModelModule,
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
    KuroModule,
    SocketModule,
    JackpotModule,
    // DiddyModule,
    KeeperModule,
    // UserModule
  ],
  controllers: [AppController, ReferralController],
  providers: [AppService, ReferralService, PointService, JwtStrategy],
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
