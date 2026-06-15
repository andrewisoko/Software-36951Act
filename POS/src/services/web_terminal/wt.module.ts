import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { WebTerminalController } from "./wt.controller";
import { WebTerminal } from "./wt.service";
import { Terminal } from "./entity/wt.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule, HttpService } from "@nestjs/axios";
import { PaymentDraft } from "./payment_draft/entity/payment.draft";
import { PaymentDraftService } from "./payment_draft/payment.draft.service";


/* initial auth approach will be a simple jwt authorisation. The app initially verifies if web POS terminal contains the token.*/

@Module({
    imports:[
        HttpModule,
        TypeOrmModule.forFeature([Terminal,PaymentDraft]),
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
    controllers:[WebTerminalController],
    providers:[
        WebTerminal,
        PaymentDraftService
    ]
})

export class WTModule {}