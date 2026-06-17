import { NestFactory } from '@nestjs/core';
import { POSModule } from './virtual_terminal/pos.module';


async function bootstrap() {
  const app = await NestFactory.create(POSModule);
  await app.listen(process.env.PORT ?? 3002); 
}
bootstrap();
