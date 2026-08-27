import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/env.validation";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { JsonLoggerService } from "./infrastructure/logging/json-logger.service";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CurriculumModule } from "./modules/curriculum/curriculum.module";
import { AccessTokenGuard } from "./modules/auth/presentation/access-token.guard";
import { RolesGuard } from "./modules/auth/presentation/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    CurriculumModule,
  ],
  providers: [
    HttpExceptionFilter,
    JsonLoggerService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
