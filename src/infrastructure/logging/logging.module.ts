import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RequestContextService } from "../../common/request-context/request-context.service";
import { Environment } from "../../config/env.validation";
import { JsonLoggerService } from "./json-logger.service";
import {
  createLoggingOptions,
  LOGGING_OPTIONS,
  LoggingOptions,
} from "./logging-options";

@Global()
@Module({
  providers: [
    RequestContextService,
    {
      provide: LOGGING_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>): LoggingOptions =>
        createLoggingOptions(config),
    },
    JsonLoggerService,
  ],
  exports: [JsonLoggerService, RequestContextService],
})
export class LoggingModule {}
