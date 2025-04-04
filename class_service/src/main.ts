import { NestFactory } from '@nestjs/core';
import { ClassModule } from './class.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ClassMicroservice');

  const app = await NestFactory.create(ClassModule);
  logger.log('Starting Class Microservice...');


  await app.listen(process.env.PORT!);

  logger.log('✅ Class Microservice is running on http://localhost:4004/graphql');
}
bootstrap();
