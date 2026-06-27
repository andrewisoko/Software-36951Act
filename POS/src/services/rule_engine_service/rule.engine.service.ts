import { Injectable,  NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RuleEngineCheckRequest } from "../orchestrator/transaction.service";
import { Repository } from "typeorm";
import { Terminal } from "../../virtual_terminal/entity/wt.entity";
import { Party } from "../party_service/entity/party.entity";





@Injectable()
export class RuleEngineService{
   constructor(
       
       @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>,
       @InjectRepository(Party) private readonly partyRepository:Repository<Party>,
   ){}
    

    async enginechecks(
        engineCheckRequest: RuleEngineCheckRequest
        ){
        
        let approved:boolean= false;
        
   
            // console.log('merchant name',engineCheckRequest.merchant )
            const checkCustomerID = await this.partyRepository.findOne({ where:{ full_name:engineCheckRequest.customer }});
            if (! checkCustomerID ) throw new NotFoundException("rule engine: customerID not found");
    
            const terminal = await this.terminalRepository.findOne({ where:{id: engineCheckRequest.terminalID }});
            if (! terminal ) throw new NotFoundException("rule engine: terminal not found");
    
            if(terminal.subject!== engineCheckRequest.merchant) throw new UnauthorizedException('rule engine: merchant error')
    
            if ( engineCheckRequest.accountStatus !== "active" ) throw new UnauthorizedException("rule engine: account not active")
            
            if( engineCheckRequest.amount > 150000 ) throw new UnauthorizedException("rule engine: Invalid amount");  /*balance check to be added.*/
            if ( engineCheckRequest.currency !== "GBP" ) throw new UnauthorizedException("rule engine: Invalid currency");
    
            approved = true
            const action = approved ? "approved": "declined";
            
    
            return {"action": action};
                }
            };