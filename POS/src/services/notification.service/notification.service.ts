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

      const response = await firstValueFrom(
        this.HttpService.post(
          "http://localhost:3100/transaction/outcome-device-app",
          {
            key:data.key,
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
      // console.log('sending message to device app', {
      //   key: data.key,
      //   message: data.message,
      //   customer: data.customer,
      //   amount: data.amount,
      //   status: data.status,
      //   currency: data.currency,
      //   merchant: data.merchant,
      //   timestamp: data.timestamp,
      // });

      return response.data
    }
  }