import { Inject, Module } from '@nestjs/common';
import { ApiGatewayModule } from 'src/api_gateway/api.gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../services/auth/auth.module';
import { Terminal } from 'src/virtual_terminal/entity/wt.entity';
import { VirtualTerminalModule } from './vt.module';
import { TransactionModule } from 'src/services/orchestrator/transaction.module';
import { Party } from 'src/services/party_service/entity/party.entity';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { RuleEngineModule } from 'src/services/rule_engine_service/rule.engine.module';
import { TokenisationModule } from 'src/services/tokenisation_service/tokenisation.module';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { AcquirerModule } from 'src/services/auth/banks/acquirer_service/acquirer.module';
import { RuleEngine } from 'src/services/rule_engine_service/entity/rule.engine.entity';
import { Acquirer } from 'src/services/auth/banks/entity/acquirer.entity';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { LedgerModule } from 'src/services/ledger.service/ledger.module';
import { SettlementEngineModule } from 'src/services/settlement/settlement_engine/settlement.module';
import { NotificationModule } from 'src/services/notification.service/notification.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from 'src/services/account_service/account.module';
import { cardJwtStrategy } from 'src/services/auth/card/card.jwt.strategy';
import { PaymentDraft } from 'src/virtual_terminal/payment_draft/entity/payment.draft';
import { PaymentDraftService } from 'src/virtual_terminal/payment_draft/payment.draft.service';
import { PaymentDraftController } from 'src/virtual_terminal/payment_draft/payment.draft.controller';




@Module({
  imports: [
    HttpModule,
    PassportModule,
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:__dirname + '/../../.env'
    },
  ),
  TransactionModule,
  RuleEngineModule,
  TokenisationModule,
  AuthModule,
  VirtualTerminalModule,
  AcquirerModule,
  ApiGatewayModule,
  AccountModule,
  LedgerModule,
  SettlementEngineModule,
  NotificationModule,
  TypeOrmModule.forFeature([PaymentDraft]),
  TypeOrmModule.forRootAsync({
    imports:[ConfigModule],
    inject:[ConfigService],
    useFactory:(configService:ConfigService) => {
      // console.log(configService.get<string>('DB_USER'))
      return{
        secret: configService.get<string>("JWT_CARD_KEY"),
        type: 'postgres',
        host: configService.get<string>('DB_HOST'), 
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize:true,
        entities:[
          Terminal,
          Party,
          Transaction,
          RuleEngine,
          Acquirer,
          Ledger,
          PaymentDraft
        ]
      }
    }
  }),
  MongooseModule.forRootAsync({
    inject: [ConfigService],
    useFactory:(configService:ConfigService) => {
      return {
        uri: configService.get<string>('MONGODB_URI'),
          dbName: 'bank',
      }
    }
  })
  ],

  controllers: [PaymentDraftController],
  providers: [cardJwtStrategy,PaymentDraftService],
})
export class POSModule {}
