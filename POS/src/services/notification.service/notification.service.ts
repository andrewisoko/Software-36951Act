import { Injectable,} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationToDeviceApp } from '../orchestrator/transaction.service';



@Injectable()
export class NotificationService {
    constructor(
        private readonly HttpService:HttpService
    ){}

  
    async sendMessage(data:NotificationToDeviceApp) 
    {
      console.log('payload',     {
            trx_id:data.trxId,
            message: data.message,
            customer:data.customer,
            amount:data.amount,
            status:data.status,
            currency:data.currency,
            merchant:data.merchant,
            timestamp:data.timestamp
          })

   

            const response = await firstValueFrom(
              this.HttpService.post(
                "http://localhost:3100/transactions/outcome-device-app",
                {
                  key: data.key,
                  trxId:data.trxId,
                  message: data.message,
                  customer:data.customer,
                  amount:data.amount,
                  status:data.status,
                  currency:data.currency,
                  merchant:data.merchant,
                  timestamp:data.timestamp
                }
              ),
            )
            console.log('[NOTIFICATION SERVICE] message sent to user through HTTP')
            return response.data
            
        

    }
  }