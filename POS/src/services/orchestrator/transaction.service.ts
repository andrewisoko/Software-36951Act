import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction, TRANSACTION_STATUS } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../../virtual_terminal/entity/wt.entity";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/virtual_terminal/payment_draft/dto/request.data.dto";
import { firstValueFrom } from 'rxjs';
import { RuleEngine } from "../rule_engine_service/entity/rule.engine.entity";
import { IssuerService } from "../auth/banks/issuer_service/issuer.service";
import { Model } from "mongoose";
import { AccountDocument } from "../account_service/document/account.doc";
import { InjectModel } from "@nestjs/mongoose";
import { LedgerService } from "../ledger.service/ledger.service";
import { SettlementService } from "../settlement/settlement_engine/settlement.service";




//--------------//
//--------------//
//--interfaces--//
//--------------//
//--------------//


export interface RuleEngineCheckRequest {

    panToken: string;
    amount: number;
    currency: string;
    merchant: string;
    accountStatus: "active" | "blocked" | "closed";
    terminalID:string
    customer:string;
    
}

export interface AcquirerRequest {
    amount:number,
    panToken: string;
    terminalid: string,
    merchant: string,
    currency:string,
    exiprationDate:string,
    fullName:string
    stan:number
}

export interface NotificationToDeviceApp {

    key: string,
    message: string,
    customer:string,
    amount:number,
    status:string
    currency:string,
    merchant:string,
    timestamp:string
}

export interface LedgerSupport {

    account_id: string,
    transaction_id: string,
    amount: number,
    currency: string,
    eventTimestamp:Date,
    status:string,
    maskedPan: string
}

///////////////////////////////////////////////////


@Injectable()
export class TransactionService{
    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectRepository(Party) private readonly partyRepository:Repository<Party>,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
        @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>,
        @InjectRepository(RuleEngine) private readonly ruleEngineRepository:Repository<RuleEngine>,
        private readonly ledgerService: LedgerService,


        private readonly encryption:EncryptSecurity,
        private readonly httpService: HttpService,
        private readonly issuerService:IssuerService,
        private readonly settlementService: SettlementService

    ){}

    /*----------------------------*/
    /*----------------------------*/
    /*------SET UPFUNCTIONS-------*/
    /*----------------------------*/
    /*----------------------------*/


            
    async createTransaction({
        terminal,
        amount,
        currency,
        pan,
        expiry,
        merchant,
        customer,
        account,

    }:Partial<FullRequestDto>

    ){
        try {
            

            let customerData = await this.partyRepository.findOne({ where:{ full_name:customer }})
            if(! customerData ){
                console.log("[TRANSACTION SERVICE] Party not found")

                    const user = await this.partyRepository.create({
                    full_name:customer
                })
                
                await this.partyRepository.save(user)
                customerData = user
            }

            
       
            const accountData = await this.accountModel.findOne({ _id:account })
            if( ! accountData ) throw new NotFoundException("[TRANSACTION SERVICE] Account not found");

            const terminalData = await this.terminalRepository.findOne({ where:{ id:terminal }})
            if(! terminalData ) throw new NotFoundException("[TRANSACTION SERVICE] terminal not found");

            const encryptedPan = JSON.stringify(this.encryption.encrypt( pan ??'Not found' ));
            const encryptExpiryDate = JSON.stringify(this.encryption.encrypt(expiry ??'Not found'));

            const transaction = await this.transactionRepository.create({

                currency:currency,
                amount:amount,
                merchant:merchant,
                customer:customerData,
                account:accountData._id.toString(),
                terminal:terminalData,
                pan_encrypt:encryptedPan,
                expiryEncrypt:encryptExpiryDate,

                })
                await this.transactionRepository.save(transaction)

                await this.accountModel.updateOne(
                    { _id: account },
                    { $push: { transactions: transaction.id } }
                );

                return transaction
            
        } catch (error) {
            console.log(`[TRANSACTION SERVICE] error at create transaction: ${error}`)
         }   
    };

    async createRuleEngineTable(
        decision,
        transaction,
    ){
        const ruleEngine = this.ruleEngineRepository.create({
            decision:decision,
            transaction:transaction
        })

        return this.ruleEngineRepository.save(ruleEngine)
    }
    
   createStan(){
        const randomNum = (Math.floor(Math.random() * 1000000) + 100);
        return randomNum
    };

 async ledgerSupport( ledgerProps: LedgerSupport){

    await this.ledgerService.saveDoubleEntry(
        {
        account_id:ledgerProps.account_id,
        transaction_id:ledgerProps.transaction_id,
        amount:ledgerProps.amount,
        currency:ledgerProps.currency,
        eventTimestamp:ledgerProps.eventTimestamp,
        status:ledgerProps.status,
        maskedPan: ledgerProps.maskedPan

        }

    )

}
    /*------------------------------*/
    /*------------------------------*/
    /*--------MAIN FUNCTION---------*/
    /*------------------------------*/
    /*------------------------------*/


    async orchestrate( /* transaction service via httpService orchestrates its operations */
    fullRequestData:FullRequestDto,
    ){      

        let transaction;
        let terminalToken;

        try {
            
            /* data from gateway-api to transaction service first hop*/
    
            transaction = await this.createTransaction({
                
                terminal:fullRequestData.terminal,
                amount:fullRequestData.amount,
                currency:fullRequestData.currency,
                pan:fullRequestData.pan,
                expiry:fullRequestData.expiry,
                merchant:fullRequestData.merchant,
                timestamp:fullRequestData.timestamp,
                customer:fullRequestData.customer,
                account:fullRequestData.account,
            })

            // console.log('data', fullRequestData)
            if (! transaction) throw new Error ("[TRANSACTION SERVICE] failed to create transaction")

            const panEncryptParse = JSON.parse(transaction.pan_encrypt);
            terminalToken = transaction.terminal.acc_token
         
            let panToken;


            /* transansaction service calls merchant service (Auth / no service logic) */
            const validateTerminalResponse = await firstValueFrom(
            this.httpService.get(
                'http://localhost:3002/auth/validation-terminal/',
                {
                headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                },
            ),
            );
            console.log(validateTerminalResponse.data);

            const stan = this.createStan()
            transaction.stan = stan
            await this.transactionRepository.save(transaction)



            /* transansaction service calls tokenise token */

           
            const tokenResponse = await firstValueFrom(

            this.httpService.post(
                'http://localhost:3002/token/pan-tokenisation/',
                { panEncrypt: panEncryptParse },
                 {
                headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                },

                )
            );

            panToken = tokenResponse.data;
            // console.log(panToken);


        //////////STOP ORCHESTRA IF ERROR//////////////////

            if( tokenResponse.status !== 201 ){
                transaction.status = TRANSACTION_STATUS.DECLINED
                await this.transactionRepository.save(transaction)
                return 'tokenisation error';
            } 
        
        ///////////////////////////////////////////////////
            
            /* transansaction service calls rule engine. */

            const ruleEngine = await firstValueFrom(
                    this.httpService.post(
                    'http://localhost:3002/rule-engine/checks/',
                    {
                        token: panToken,
                        amount: fullRequestData.amount,
                        currency: fullRequestData.currency,
                        merchant: fullRequestData.merchant,
                        accountStatus: (await this.accountModel.findById(fullRequestData.account))?.status ?? fullRequestData.accountStatus,
                        terminalID:fullRequestData.terminal,
                        customer: fullRequestData.customer,

                        
                    },
                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },
                )
            ); 
            console.log("[TRANSACTION SERVICE ] rule engine:", ruleEngine.data);

            const decision = ruleEngine.data["action"]
            const ruleEngineTable = await this.createRuleEngineTable(decision,transaction);
            transaction.rule_engine = ruleEngineTable;


        //////////STOP ORCHESTRA IF ERROR//////////////////

        
                if( ruleEngine.status !== 201 ){
                transaction.status = TRANSACTION_STATUS.DECLINED
                await this.transactionRepository.save(transaction)
                return 'rule engine error';
                } 
        
        ///////////////////////////////////////////////////
               
            /*banks talking to each other */

            const acquirerService = await firstValueFrom(
                this.httpService.post(
                     'http://localhost:3002/acquirer/bank/',
                    {
                        amount:transaction.amount,
                        pan: panToken,
                        terminalid:transaction.terminal.id,
                        merchant: transaction.merchant,
                        currency: transaction.currency,
                        exiprationDate: transaction.expiryEncrypt,
                        fullName: transaction.customer.full_name,
                        stan:transaction.stan
        
                    },                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },

                )
            )

        //////////STOP ORCHESTRA IF ERROR//////////////////

                if( acquirerService.status !== 201 ){
                transaction.status = TRANSACTION_STATUS.DECLINED
                await this.transactionRepository.save(transaction)
                return 'acquirer service error';
                } 
        
        ///////////////////////////////////////////////////
            
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            // console.log(acquirerService.status)

            const issuerService = this.issuerService.IssuerBankService();

          

            let approvedTrn: Transaction | null = null;


            for (let i = 0; i < 20; i++) {
                await sleep(500);

                approvedTrn = await this.transactionRepository.findOne({ where:{ id:transaction.id } });
                if ( !approvedTrn ) throw new NotFoundException( "[TRANSACTION SERVICE] Transaction not found when calling issuer service" );
        
                if (approvedTrn && approvedTrn.status === TRANSACTION_STATUS.APPROVED ){
        
                try {
                    
                    const notificationService = await firstValueFrom(
                        this.httpService.post('http://localhost:3002/notification/device-app-message',
                            {
                                key:fullRequestData.key,
                                message: "Transaction details",
                                customer:fullRequestData.customer,
                                amount:fullRequestData.amount,
                                status: approvedTrn.status,
                                currency:fullRequestData.currency,
                                merchant:fullRequestData.merchant,
                                timestamp:fullRequestData.timestamp,
                            },
                            {
                                headers: {
                                Authorization: `Bearer ${terminalToken}`,
                                },
                            },
                            
                        )
                    )

        
                //////////STOP ORCHESTRA IF ERROR//////////////////
        
                    if( notificationService.status !== 201 ){
                        
                        const timestamp = new Date(Date.now())
                        const jsonPan = JSON.parse(transaction.pan_encrypt)
                        const rawPan = this.encryption.decrypt( jsonPan);
                        const maskPan:string = rawPan.toString().slice(-4).padStart(12,'*')

                        const settlementRefundSupport = this.settlementService.refund(fullRequestData.account,transaction,fullRequestData.amount )

                        this.ledgerSupport({
                            account_id:fullRequestData.account,
                            transaction_id: transaction.id,
                            amount: fullRequestData.amount,
                            currency:'GBP',
                            eventTimestamp: timestamp,
                            status: 'refunded',
                            maskedPan:maskPan
                        })
                        
                        console.log( 'transaction status', transaction.status );
                        console.log( 'notification service error');

                        break;
                    } 

                ///////////////////////////////////////////////////
    
                    const settlementEngine = await firstValueFrom(
                        this.httpService.post(
                            'http://localhost:3002/settlement/engine-updates',
                            {id:transaction.id},
                                {
                                headers: {
                                Authorization: `Bearer ${terminalToken}`,
                                },
                            },
        
                        )
                    )
                    } catch (error) {
                       console.log('[TRANSACTION SERVICE] error after transaction approved', error)
                       break; 
                    }
        
                    break;
                }
            }
            

        } catch (error) {
            console.log(`[TRANSACTION SERVICE] Error at transaction orchestra: ${error}`)

            const notificationService = await firstValueFrom(
                this.httpService.post('http://localhost:3002/notification/device-app-message',
                    {
                        key:fullRequestData.key,
                        message: 'transaction failed',
                        customer:fullRequestData.customer,
                        amount:fullRequestData.amount,
                        status: transaction.status,
                        currency:'GBP',
                        merchant:fullRequestData.merchant,
                        timestamp:fullRequestData.timestamp,
                    },
                    {
                        headers: {
                        Authorization: `Bearer ${terminalToken}`,
                        },
                    },
                    
                ))
            }};
        };