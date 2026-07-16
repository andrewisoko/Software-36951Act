import { Controller,Body,Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Role } from '../../virtual_terminal/entity/wt.entity';
import { Roles } from '../auth/roles/roles.decorators';
import { JwtAuthGuard } from '../auth/authGuard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles/roles.guard';
import type { NotificationToDeviceApp } from '../orchestrator/transaction.service';

@Controller('notification')
export class NotificationController {

    constructor( private readonly notificationService: NotificationService ){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post("device-app-message")
    async notification(
        @Body() dataDto: NotificationToDeviceApp
    ){ dataDto

        return this.notificationService.sendMessage({
            key: dataDto.key,
            trxId:dataDto.trxId,
            message: dataDto.message,
            customer:dataDto.customer,
            amount: dataDto.amount,
            status:dataDto.status,
            currency:dataDto.currency,
            merchant:dataDto.merchant,
            timestamp:dataDto.timestamp,
            pan_encrypt: dataDto.pan_encrypt
        })
        
    }
}
