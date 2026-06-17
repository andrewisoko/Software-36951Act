

import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api.gateway.controller';
import { ApiGatewayService } from './api.gateway.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Terminal } from 'src/virtual_terminal/entity/wt.entity';
import { HttpModule, HttpService } from '@nestjs/axios';
@Module({
    imports:[
        HttpModule,
        TypeOrmModule.forFeature([Terminal])
    ],
    controllers:[ApiGatewayController],
    providers:[ApiGatewayService]
})
export class ApiGatewayModule {}