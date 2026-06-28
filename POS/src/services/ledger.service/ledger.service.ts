import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ledger, LedgerDirection, LedgerEntryType } from './entity/ledger.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TRANSACTION_STATUS } from '../orchestrator/entity/transaction.entity';



export interface LedgerRecord {
    account_id:string,
    transaction_id:string,
    amount:number,
    currency:string,
    eventTimestamp:Date,
    status:string
    maskedPan:string,
}

@Injectable()
export class LedgerService {

    constructor(
        @InjectRepository(Ledger) private readonly ledgerRepository: Repository<Ledger>
    ){}

  async saveDoubleEntry(record: LedgerRecord) {  /*this is the best approach for guaranteed atomicity */
  return this.ledgerRepository.manager.transaction(async manager => {

    const commonKey = randomUUID(); 

    const debit = manager.create(Ledger, {
      account_id: record.account_id, 
      transaction_id: record.transaction_id,
      amount: record.amount,
      currency: record.currency,
      direction: LedgerDirection.DEBIT,
      entry_type: LedgerEntryType.AUTHORIZATION_HOLD,
      event_timestamp: record.eventTimestamp,
      status: record.status,
      masked_pan: record.maskedPan,
      idempotency_key: commonKey + '_D'
    });

    const credit = manager.create(Ledger, {

      account_id: record.account_id, 
      transaction_id: record.transaction_id,
      amount: record.amount,
      currency: record.currency,
      direction: LedgerDirection.CREDIT,
      entry_type: LedgerEntryType.AUTHORIZATION_HOLD,
      event_timestamp: record.eventTimestamp,
      status: record.status,
       masked_pan: record.maskedPan,
      idempotency_key: commonKey + '_C'
    });

    await manager.save([debit, credit]);

    return 'Legder CREDIT and DEBIT update';
  });
}
}
