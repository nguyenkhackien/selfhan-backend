import { Injectable, LoggerService } from "@nestjs/common";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "database_url",
]);

@Injectable()
export class JsonLoggerService implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }

  error(message: unknown, ...optionalParameters: unknown[]): void {
    this.write("error", message, this.contextFrom(optionalParameters));
  }

  warn(message: unknown, ...optionalParameters: unknown[]): void {
    this.write("warn", message, this.contextFrom(optionalParameters));
  }

  debug(message: unknown, ...optionalParameters: unknown[]): void {
    this.write("debug", message, this.contextFrom(optionalParameters));
  }

  verbose(message: unknown, ...optionalParameters: unknown[]): void {
    this.write("verbose", message, this.contextFrom(optionalParameters));
  }

  fatal(message: unknown, ...optionalParameters: unknown[]): void {
    this.write("fatal", message, this.contextFrom(optionalParameters));
  }

  private write(level: string, message: unknown, context?: string): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        ...(context === undefined ? {} : { context }),
        ...this.normalize(message),
      }),
    );
  }

  private normalize(message: unknown): Record<string, unknown> {
    if (message instanceof Error) {
      return { message: message.message, errorName: message.name };
    }

    if (typeof message === "object" && message !== null) {
      return this.redact(message) as Record<string, unknown>;
    }

    return { message };
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redact(item));
    }

    if (typeof value !== "object" || value === null) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase())
          ? "[REDACTED]"
          : this.redact(entry),
      ]),
    );
  }

  private contextFrom(optionalParameters: unknown[]): string | undefined {
    const lastParameter = optionalParameters.at(-1);
    return typeof lastParameter === "string" ? lastParameter : undefined;
  }
}
