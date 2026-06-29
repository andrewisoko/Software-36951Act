import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from 'src/services/account_service/document/account.doc';
import { LedgerService } from 'src/services/ledger.service/ledger.service';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';


@Module({
    imports:[

        TypeOrmModule.forFeature([Transaction,Ledger]),
        MongooseModule.forFeature([ {name:'Account', schema: AccountSchema} ])
],
    controllers:[SettlementController],
    providers:[SettlementService,LedgerService,EncryptSecurity
    ],
    exports:[SettlementService]

})
export class SettlementEngineModule {}
