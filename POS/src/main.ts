import { NestFactory } from '@nestjs/core';
import { POSModule } from './virtual_terminal/pos.module';


async function bootstrap() {
  const app = await NestFactory.create(POSModule);
  
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3002); 

}
bootstrap();
