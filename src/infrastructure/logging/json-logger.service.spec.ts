import { RequestContextService } from "../../common/request-context/request-context.service";
import { JsonLoggerService } from "./json-logger.service";
import { LoggingOptions } from "./logging-options";

function createLogger(overrides: Partial<LoggingOptions> = {}): {
  logger: JsonLoggerService;
  requestContext: RequestContextService;
} {
  const requestContext = new RequestContextService();
  return {
    logger: new JsonLoggerService(requestContext, {
      format: "json",
      minimumLevel: "trace",
      ...overrides,
    }),
    requestContext,
  };
}

describe("JsonLoggerService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redacts sensitive values before writing structured logs", () => {
    const write = jest.spyOn(console, "log").mockImplementation();
    const { logger } = createLogger();

    logger.log(
      {
        authorization: "Bearer secret",
        password: "hidden",
        refreshToken: "hidden",
        userId: "user-1",
      },
      "Login",
    );

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"authorization":"[REDACTED]"'),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"password":"[REDACTED]"'),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"refreshToken":"[REDACTED]"'),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"userId":"user-1"'),
    );
  });

  it("adds the active request ID to structured logs", () => {
    const write = jest.spyOn(console, "log").mockImplementation();
    const { logger, requestContext } = createLogger();

    requestContext.run({ requestId: "req-42" }, () => {
      logger.warn({ event: "permission.denied" }, "RolesGuard");
    });

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"requestId":"req-42"'),
    );
  });

  it("suppresses levels below the configured threshold", () => {
    const write = jest.spyOn(console, "log").mockImplementation();
    const { logger } = createLogger({ minimumLevel: "warn" });

    logger.trace("trace message");
    logger.debug("debug message");
    logger.verbose("verbose message");
    logger.log("info message");
    logger.warn("warning message");

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("warning message"),
    );
  });

  it("renders coloured error levels in pretty format", () => {
    const write = jest.spyOn(console, "error").mockImplementation();
    const { logger, requestContext } = createLogger({ format: "pretty" });

    requestContext.run({ requestId: "req-colour" }, () => {
      logger.error({ event: "database.unavailable" }, "DatabaseModule");
    });

    expect(write).toHaveBeenCalledWith(expect.stringContaining("\u001B[31m"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("ERROR"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("[req-colour]"));
  });
});
