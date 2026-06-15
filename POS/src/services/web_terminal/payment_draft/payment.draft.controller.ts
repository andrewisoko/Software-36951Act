// payment-draft.controller.ts
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { PaymentDraftService } from './payment.draft.service';



@Controller('payment-drafts')
export class PaymentDraftController {
  constructor(private readonly service: PaymentDraftService) {}

  // 1. Terminal sets amount FIRST
  @Post()
  createDraft(@Body() dto: {terminalId:string, amount:number, currency:string}) {
    return this.service.createDraft(dto.terminalId,dto.amount,dto.currency);
  }

  // 2. Terminal scans card QR AFTER amount exists
  @Post(':id/attach-card')
  attachCard(
    @Param('id') id: string,
    @Body() dto: { cardToken: string;}
  ) {
    return this.service.attachCard(id, dto.cardToken);
  }

  // 3. Terminal checks status (polling fallback)
  @Get(':id')
  getDraft(@Param('id') id: string) {
    return this.service.getDraft(id);
  }

//   // 4. Force completion (or internal worker trigger)
//   @Post(':id/complete')
//   complete(@Param('id') id: string) {
//     return this.service.completeDraft(id);
//   }
}