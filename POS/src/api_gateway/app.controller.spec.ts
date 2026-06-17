import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayController } from './api.gateway.controller';
import { ApiGatewayService } from './api.gateway.service';

describe('AppController', () => {
  let appController: ApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGatewayController],
      providers: [ApiGatewayService],
    }).compile();

    appController = app.get<ApiGatewayController>(ApiGatewayController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
