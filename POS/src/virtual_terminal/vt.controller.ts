import { Controller, UseGuards, Post,Body,Get,Req } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { VirtualTerminalService } from "./vt.service";
import { AuthGuard } from "@nestjs/passport";



export interface CardDetails {
    pan: string,
    currency: string,
    expiry: string,
    merchant: string,
    customer: string,
    account: string,
}

export interface Draft{
    terminalId: string,
    amount:number,
    currency:string,
}





@Controller('terminal')
export class VirtualTerminalController{

    constructor(private readonly webTerminal:VirtualTerminalService){}

    @UseGuards(AuthGuard('card-jwt'))
    @Get('create-terminal')
    createWT(){
        return this.webTerminal.CreateWT()
    }

}