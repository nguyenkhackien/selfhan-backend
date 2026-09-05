import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { ApplicationLogLevel } from "../../config/env.validation";
import { RequestContextService } from "../../common/request-context/request-context.service";
import { LOGGING_OPTIONS, LoggingOptions } from "./logging-options";

const SENSITIVE_KEY_FRAGMENTS = [
  "authorization",
  "cookie",
  "password",
  "token",
  "apikey",
  "secret",
  "databaseurl",
  "connectionstring",
  "credential",
] as const;

const LEVEL_RANK: Record<ApplicationLogLevel, number> = {
  trace: 10,
  debug: 20,
  verbose: 30,
  info: 40,
  warn: 50,
  error: 60,
  fatal: 70,
};

const ANSI = {
  cyan: "\u001B[36m",
  debug: "\u001B[34m",
  error: "\u001B[31m",
  fatal: "\u001B[41m",
  info: "\u001B[32m",
  reset: "\u001B[0m",
  trace: "\u001B[90m",
  verbose: "\u001B[35m",
  warn: "\u001B[33m",
} as const;

type LogRecord = {
  context?: string;
  level: ApplicationLogLevel;
  requestId?: string;
  timestamp: string;
} & Record<string, unknown>;

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(
    private readonly requestContext: RequestContextService,
    @Inject(LOGGING_OPTIONS) private readonly options: LoggingOptions,
  ) {}

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

  trace(message: unknown, context?: string): void {
    this.write("trace", message, context);
  }

  private write(
    level: ApplicationLogLevel,
    message: unknown,
    context?: string,
  ): void {
    if (!this.isEnabled(level)) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      ...(context === undefined ? {} : { context }),
      ...this.normalize(message),
      ...(this.requestContext.getRequestId() === undefined
        ? {}
        : { requestId: this.requestContext.getRequestId() }),
    };
    const output =
      this.options.format === "json"
        ? this.stringify(record)
        : this.formatPretty(record);

    if (level === "error" || level === "fatal") {
      console.error(output);
      return;
    }

    console.log(output);
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

  private redact(value: unknown, seen = new WeakSet<object>()): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redact(item, seen));
    }

    if (typeof value !== "object" || value === null) {
      return value;
    }

    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        this.isSensitiveKey(key) ? "[REDACTED]" : this.redact(entry, seen),
      ]),
    );
  }

  private isEnabled(level: ApplicationLogLevel): boolean {
    return LEVEL_RANK[level] >= LEVEL_RANK[this.options.minimumLevel];
  }

  private isSensitiveKey(key: string): boolean {
    const normalizedKey = key.replaceAll(/[^a-z0-9]/gi, "").toLowerCase();
    return SENSITIVE_KEY_FRAGMENTS.some((fragment) =>
      normalizedKey.includes(fragment),
    );
  }

  private stringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return JSON.stringify({
        level: "error",
        message: "Log serialization failed.",
        timestamp: new Date().toISOString(),
      });
    }
  }

  private formatPretty(record: LogRecord): string {
    const { context, level, requestId, timestamp, ...details } = record;
    const color = ANSI[level];
    const contextLabel = context === undefined ? "" : ` [${context}]`;
    const requestLabel =
      requestId === undefined ? "" : ` ${ANSI.cyan}[${requestId}]${ANSI.reset}`;
    const detailLabel =
      Object.keys(details).length === 0 ? "" : ` ${this.stringify(details)}`;

    return `${color}${timestamp} ${level.toUpperCase().padEnd(7)}${ANSI.reset}${requestLabel}${contextLabel}${detailLabel}`;
  }

  private contextFrom(optionalParameters: unknown[]): string | undefined {
    const lastParameter = optionalParameters.at(-1);
    return typeof lastParameter === "string" ? lastParameter : undefined;
  }
}
