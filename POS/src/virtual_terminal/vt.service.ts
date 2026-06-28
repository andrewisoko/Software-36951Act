import { Injectable, NotFoundException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Terminal } from "./entity/wt.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "./entity/wt.entity";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/virtual_terminal/payment_draft/dto/request.data.dto";
import { firstValueFrom } from "rxjs";




@Injectable()
export class VirtualTerminalService{
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
        serial_number: serialNumber,
        signature,
        issuer: 'Tutorial Bank',
        subject: 'TRANSACT RETAIL',
        role: Role.TERMINAL,
    };

    //
    const terminal = this.TerminalRepository.create(certTerminal);

    
    const terminalUpdated = await this.TerminalRepository.save(terminal);

    const terminal_token = this.jwtService.sign({
      
        serialNumber: terminalUpdated.serial_number,
        role: terminalUpdated.role,
    });

    terminalUpdated.acc_token = terminal_token;
    await this.TerminalRepository.save(terminalUpdated);

    return terminalUpdated;

    }

}
