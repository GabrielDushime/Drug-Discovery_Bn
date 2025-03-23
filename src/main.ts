import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { setupSwagger } from '../swagger.config';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path'

async function bootstrap() {
  dotenv.config();


  const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }


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


  const port = process.env.PORT || 8000;
  await app.listen(port);
  
  console.log(`Welcome to Scientific Computing for Drug Discovery!`);
  console.log(`Server running on port: ${port}`);
}
bootstrap();