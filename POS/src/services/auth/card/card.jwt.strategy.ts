import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';


@Injectable()
export class cardJwtStrategy extends PassportStrategy(Strategy, 'card-jwt') {
  constructor(
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_CARD_KEY') as string,
    });
  }


    async validate(transactionDetails: any) {


 
        return {
       
          pan: transactionDetails.pan,
          expiry: transactionDetails.expiry,
          customer:transactionDetails.customer,
          account:transactionDetails.account,
        }
  }
}