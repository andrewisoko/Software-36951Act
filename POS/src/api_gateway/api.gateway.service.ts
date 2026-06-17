import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FullRequestDto } from 'src/virtual_terminal/payment_draft/dto/request.data.dto';
import { firstValueFrom } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Terminal } from 'src/virtual_terminal/entity/wt.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ApiGatewayService {
  constructor(
    @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>,
    private readonly httpService: HttpService,
  ){}
  


      async RedirectToOrchestra( 
      
           transactionDetails:Partial<FullRequestDto>
        ){

        const virtualTerminal = await this.terminalRepository.findOne({where:{id:transactionDetails.terminal}});
        if( !virtualTerminal ) throw new NotFoundException('temrnial not found')

        const response = await firstValueFrom( this.httpService.post(
            'http://localhost:3002/transaction/orchestra',
            {
                terminal:virtualTerminal.id,
                amount: transactionDetails.amount,
                currency: transactionDetails.currency,
                pan: transactionDetails.pan,
                expiry: transactionDetails.expiry,
                merchant: transactionDetails.merchant,
                timestamp: transactionDetails.timestamp,
                customer: transactionDetails.customer,
                account: transactionDetails.account,
            },
            {
                headers:{
                    Authorization:`Bearer ${virtualTerminal.acc_token}`
                },
            },
        ))

        return response.data
    }

}

