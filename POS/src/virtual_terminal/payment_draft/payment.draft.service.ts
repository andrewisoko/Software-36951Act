import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentDraft } from './entity/payment.draft';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ParamsTokenFactory } from '@nestjs/core/pipes';


@Injectable()
export class PaymentDraftService {
  constructor(
    @InjectRepository(PaymentDraft)
    private readonly draftRepo: Repository<PaymentDraft>,
    private readonly httpService: HttpService
  ) {}

  async createDraft(
    terminalId: string,
    amount: number,
    currency: string
  ) {
    const draft = this.draftRepo.create({
      terminalId: terminalId,
      amount: amount,
      currency: currency,
      status: 'AWAITING_CARD_SCAN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 2 min TTL
    });
    return this.draftRepo.save(draft);
  }

  async attachCard(draftId: string, cardToken: string) {
    const draft = await this.draftRepo.findOne({
      where: { id: draftId },
    });

    if (!draft) throw new NotFoundException('Draft not found');

    if (draft.status !== 'AWAITING_CARD_SCAN') {
      throw new BadRequestException('Draft not scannable');
    }

    if (draft.expiresAt.getTime() < Date.now()) {
      draft.status = 'EXPIRED';
      await this.draftRepo.save(draft);
      throw new BadRequestException('Draft expired');
    }

    draft.status = 'PROCESSING';
    draft.cardToken = cardToken;


    const scannedValue = cardToken;

    const token = scannedValue.replace(
        'paycard://',
        '',
    );


    const transactionRequest = await firstValueFrom(
        this.httpService.post(
            'http://localhost:3002/api-gateway/',
            {
                terminal:draft.terminalId,
                amount:draft.amount,
                currency:'GBP'
            },
            {
            headers: {
                Authorization: `Bearer ${token}`,
                },
            },
        )

    )

    if(transactionRequest.status !== 201 ){
        draft.status = 'FAILED';
    }else{
        draft.status = 'COMPLETED'
    }

    return this.draftRepo.save(draft);
  }


   async getDraft(id: string) {
    return this.draftRepo.findOne({ where: { id } });
  }

}