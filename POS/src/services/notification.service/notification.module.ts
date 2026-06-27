import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { HttpModule } from '@nestjs/axios';





@Module({

  imports: [
   HttpModule
  ],
  providers: [NotificationService],
  controllers: [NotificationController]
})
export class NotificationModule {}
