import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { VirtualTerminalController } from "./vt.controller";
import { VirtualTerminalService } from "./vt.service";
import { Terminal } from "./entity/wt.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule, } from "@nestjs/axios";



@Module({
    imports:[
        HttpModule,
        TypeOrmModule.forFeature([Terminal]),
        PassportModule,
        JwtModule.registerAsync({
            imports:[ConfigModule],
            inject:[ConfigService],
            useFactory:(configService:ConfigService) => {
                return{
                    global: true,
                    secret: configService.get<string>("JWT_KEY"),
               
                }
            },
        })
    ], 
    controllers:[VirtualTerminalController],
    providers:[
        VirtualTerminalService
    ]
})

export class VirtualTerminalModule {}