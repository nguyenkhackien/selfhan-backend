import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JsonLoggerService } from "./infrastructure/logging/json-logger.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(JsonLoggerService);
  const config = app.get(ConfigService);

  app.useLogger(logger);
  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: config.getOrThrow<string>("FRONTEND_ORIGIN"),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>("PORT"));
}

void bootstrap();
