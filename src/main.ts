import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { setupSwagger } from '../swagger.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  setupSwagger(app);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Use PORT from environment variable (provided by Render)
  const port = process.env.PORT || 8000;
  await app.listen(port);
  
  console.log(`Welcome to Scientific Computing for Drug Discovery!`);
  console.log(`Server running on port: ${port}`);
}
bootstrap();