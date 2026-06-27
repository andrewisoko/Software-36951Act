import { Module } from "@nestjs/common";
import { TokenisationController } from "./tokenisation.controller";
import { TokenisationService } from "./tokenisation.service";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";
import { HttpModule } from "@nestjs/axios";
import { NotificationService } from "../notification.service/notification.service";

@Module({
    imports:[
        HttpModule
    ],
    controllers:[TokenisationController],
    providers:[TokenisationService,EncryptSecurity,NotificationService],
})

export class TokenisationModule{}