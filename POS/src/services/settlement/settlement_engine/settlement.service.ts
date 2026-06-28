import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/services/account_service/document/account.doc';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { LedgerService } from 'src/services/ledger.service/ledger.service';
import { Transaction, TRANSACTION_STATUS } from 'src/services/orchestrator/entity/transaction.entity';
import { Not, Repository } from 'typeorm';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';


@Injectable()
export class SettlementService {

    constructor(
      @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
      @InjectRepository(Ledger) private readonly ledgerRepository:Repository<Ledger>,
      @InjectModel('Account') private readonly accountModel: Model<AccountDocument>,
      private readonly ledgerService:LedgerService,
      private readonly encryption:EncryptSecurity,
    ){}

    async findTransactStatus(id:string){

      const transaction = await this.transactionRepository.findOne({where:{id:id}});
      if (!transaction) throw new Error ("Transaction not found");

      return transaction.status

    }

    async updates(id:string){

      const transaction = await this.transactionRepository.findOne({where:{id:id}});
      if (!transaction) throw new Error ("[SETTLEMENT ENGINE] Transaction not found");

      const transactionStatus = await this.findTransactStatus(id);
      if (transactionStatus === TRANSACTION_STATUS.APPROVED || transactionStatus === TRANSACTION_STATUS.REFUNDED ){

        const account = await this.accountModel.findOne({ _id: transaction.account });
        if (!account) throw new Error ("[SETTLEMENT ENGINE] Account not found");
  
  
        await this.accountModel.updateOne(
          { _id: account._id },
          { 
            $inc: { ledger_balance: -account.hold, hold: -account.hold }
          }
        );
  
        transaction.status = TRANSACTION_STATUS.SETTLED


        await this.transactionRepository.save(transaction)
  
           console.log ({
              message: "Account updated",
              transaction_status: transaction.status
          } );

        const ledgerSettled = await this.ledgerRepository.findOne({where:{ transaction_id: transaction.id, status:'settled' }})
        if( !ledgerSettled ){

            const timestamp = new Date(Date.now())
            const rawPan = JSON.stringify(this.encryption.decrypt( transaction.pan_encrypt ??'Not found' ));
            const maskPan:string = rawPan.toString().slice(-4).padStart(12,'*')


             await this.ledgerService.saveDoubleEntry(
              {
                account_id:account.id,
                transaction_id:transaction.id,
                amount:account.hold,
                currency:"GBP",
                eventTimestamp:timestamp,
                status:transaction.status,
                maskedPan: maskPan

              }
            )

          }
        }
      } 
   
    }

