import { Injectable, NotFoundException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Terminal } from "./entity/wt.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "./entity/wt.entity";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";
import { firstValueFrom } from "rxjs";




@Injectable()
export class WebTerminal{
    constructor(
        @InjectRepository(Terminal) private readonly TerminalRepository: Repository<Terminal>,
        private readonly httpService:HttpService,
        private readonly jwtService:JwtService,
    ){}

    generateSerialNum(){
        const randomNum = (Math.floor(Math.random() * 100000000) + 100);
        return randomNum
      }

    generateSignature(){
        /* cheap imitation of sha256WithRSAEncryption algorithm output*/

        let randomNum = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + 100000000000000000000n /* using Big int since interger chosen overpass js number's precision limit. (20 digits)*/
        let objContainer =  randomNum.toString().split("");

        const objWithDots = () => { 
        for(let items of objContainer){
            objContainer[1] = objContainer[3] = objContainer[7] = objContainer[14] = objContainer[16] = objContainer[18] = ".";
            
            return objContainer.join('')
        }
        }
        return objWithDots()
    }

   
  async CreateWT() {
    const serialNumber = this.generateSerialNum();
    const signature = this.generateSignature();

    const certTerminal = {
        serialNumber,
        signature,
        issuer: 'Tutorial Bank',
        subject: 'Merchant Tutorial',
        role: Role.TERMINAL,
    };

    //
    const terminal = this.TerminalRepository.create(certTerminal);

    
    const saved = await this.TerminalRepository.save(terminal);

    const terminal_token = this.jwtService.sign({
      
        serialNumber: saved.serial_number,
        role: saved.role,
    });

    saved.acc_token = terminal_token;
    await this.TerminalRepository.save(saved);

    return {
        terminal_token,
    };
}



    async terminalReqTransaction( terminalId:string, amount:number, transactionDetails:Partial<FullRequestDto>){

        const wbTerminal = await this.TerminalRepository.findOne({where:{id:terminalId}});
        if( !wbTerminal ) throw new NotFoundException('temrnial not found')

        const response = await firstValueFrom( this.httpService.post(
            'http://localhost:3002/api.gateway/',
            {
                pan: transactionDetails.pan,
                amount: amount,
                currency: transactionDetails.currency,
                expiry: transactionDetails.expiry,
                merchant: transactionDetails.merchant,
                timestamp: transactionDetails.timestamp,
                customer: transactionDetails.customer,
                account: transactionDetails.account,
                terminal:wbTerminal.id
            },
            {
                headers:{
                    Authorization:`Bearer ${wbTerminal.acc_token}`
                },
            },
        ))

        return response.data
    }

}
