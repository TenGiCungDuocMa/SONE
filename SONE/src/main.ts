import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('SONE API')
    .setDescription('The SONE API description')
    .setVersion('1.0')
    .addBearerAuth() // Add JWT authentication
    .build();

  // Create the Swagger document with the global prefix
  const documentFactory = () => SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false, // Ensure the global prefix is included in Swagger
  });

  // Setup Swagger at `/api`
  SwaggerModule.setup('api', app, documentFactory,{
    customSiteTitle: "API Docs", // Optional: Customize the page title
  });

  const port = Number(process.env.PORT) || 3333;
  await app.listen(port);
}
bootstrap();
