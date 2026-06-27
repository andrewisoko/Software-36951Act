
import { Body, Controller,Post,Req, UseGuards} from '@nestjs/common';
import { ApiGatewayService } from './api.gateway.service';
import { FullRequestDto } from 'src/virtual_terminal/payment_draft/dto/request.data.dto';
import { AuthGuard } from '@nestjs/passport';


export interface Draft{
    terminalId: string,
    amount:number,
    currency:string,
}

@Controller()
export class ApiGatewayController {
  constructor( private readonly apiGatewayService:ApiGatewayService ){}

 
  // @Post('api-gateway')
  // RedirectTransactionController(
  //   @Body() dataDto:FullRequestDto
  // ){
  //   return this.apiGatewayService.redirectTransaction(dataDto)
  // }
  @UseGuards(AuthGuard('card-jwt'))
  @Post('api-gateway')
  redirectTerminal(
      @Body() paymentDraft:Draft,
      @Req()  req
  ){
        const timestamp = new Date().toISOString();
        return this.apiGatewayService.RedirectToOrchestra(
              {
                key:req.user.key,
                terminal: paymentDraft.terminalId,
                amount: paymentDraft.amount,
                currency: 'GBP',
                pan: req.user.pan.toString(),
                expiry:req.user.expiry,
                merchant:"TRANSACT RETAIL",
                timestamp: timestamp,
                customer: req.user.customer,
                account:req.user.account
               }
        )
    }
  }



