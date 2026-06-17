// payment-draft.controller.ts
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { PaymentDraftService } from './payment.draft.service';



@Controller('payment-drafts')
export class PaymentDraftController {
  constructor(private readonly service: PaymentDraftService) {}

  @Post('attach-card')
  attachCard(
    @Body() dto: {id: string, cardToken: string;}
  ) {
    return this.service.attachCard(dto.id, dto.cardToken);
  }

  @Post('create')
  createDraft(@Body() dto: {terminalId:string, amount:number, currency:string}) {
    return this.service.createDraft(dto.terminalId,dto.amount,dto.currency);
  }

 
  @Get(':id')
  getDraft(@Param('id') id: string) {
    return this.service.getDraft(id);
  }

}