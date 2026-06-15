import { Controller, UseGuards, Post,Body,Get,Req } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { WebTerminal } from "./wt.service";
import { AuthGuard } from "@nestjs/passport";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";

export interface CardDetails {
            pan: string,
            amount: number,
            currency: string,
            expiry: string,
            merchant: string,
            customer: string,
            account: string,
}



@Controller('terminal')
export class WebTerminalController{

    constructor(private readonly webTerminal:WebTerminal){}

    @UseGuards(AuthGuard('card-jwt'))
    @Get('create-terminal')
    createWT(){
        return this.webTerminal.CreateWT()
    }

    @UseGuards(AuthGuard('card-jwt'))
    @Post('req-term-transact')
    terminalReqTransaction(
   
        @Body() requestDto:{cardDetails: CardDetails,amount:number,terminalID:string}
    ){
        const timestamp = new Date().toDateString()
        return this.webTerminal.terminalReqTransaction(
                
               {
                pan: requestDto.cardDetails.pan,
                amount:requestDto.amount,
                currency: 'GBP',
                expiry:requestDto.cardDetails.expiry,
                merchant:"TEST MERCHANT LONDON GB",
                timestamp: timestamp,
                customer: requestDto.cardDetails.customer,
                account:requestDto.cardDetails.account
               }
        )
    }


}