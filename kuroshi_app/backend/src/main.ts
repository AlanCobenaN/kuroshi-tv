import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';

// ── Serialización global: BigInt → Number ──────────────────
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Prefijo global de la API ──────────────────────────────
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // ── Validación global con class-validator ─────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // elimina campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true,          // convierte automáticamente tipos primitivos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Interceptor global: camelCase → snake_case ───────────
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
      'https://kuroshi.lat',
      'https://www.kuroshi.lat',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Swagger (solo en desarrollo) ──────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Kuroshi.lat API')
      .setDescription('API REST de la plataforma Kuroshi.lat')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

    console.log(
      `📖 Swagger disponible en: http://localhost:${process.env.PORT ?? 4000}/${apiPrefix}/docs`,
    );
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 Kuroshi.lat backend corriendo en: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();