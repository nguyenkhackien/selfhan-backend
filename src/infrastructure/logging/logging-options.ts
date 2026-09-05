import {
  ApplicationLogLevel,
  Environment,
  LogFormat,
} from "../../config/env.validation";

export const LOGGING_OPTIONS = Symbol("LOGGING_OPTIONS");

export interface LoggingOptions {
  format: LogFormat;
  minimumLevel: ApplicationLogLevel;
}

export interface LoggingConfigReader {
  get(key: "LOG_FORMAT"): LogFormat | undefined;
  getOrThrow(key: "NODE_ENV"): Environment["NODE_ENV"];
  getOrThrow(key: "LOG_LEVEL"): ApplicationLogLevel;
}

export function createLoggingOptions(
  config: LoggingConfigReader,
): LoggingOptions {
  const nodeEnv = config.getOrThrow("NODE_ENV");
  const configuredFormat = config.get("LOG_FORMAT");

  return {
    format: configuredFormat ?? (nodeEnv === "production" ? "json" : "pretty"),
    minimumLevel: config.getOrThrow("LOG_LEVEL"),
  };
}
