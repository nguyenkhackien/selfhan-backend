import { EventEmitter } from "node:events";
import { RequestContextService } from "../request-context/request-context.service";
import { RequestIdMiddleware } from "./request-id.middleware";
import { JsonLoggerService } from "../../infrastructure/logging/json-logger.service";
import { LoggingOptions } from "../../infrastructure/logging/logging-options";

type TestResponse = EventEmitter & {
  locals: Record<string, string>;
  setHeader: jest.Mock;
  statusCode: number;
};

function createMiddleware(): {
  logger: JsonLoggerService;
  middleware: RequestIdMiddleware;
  requestContext: RequestContextService;
} {
  const requestContext = new RequestContextService();
  const options: LoggingOptions = { format: "json", minimumLevel: "trace" };
  const logger = new JsonLoggerService(requestContext, options);

  return {
    logger,
    middleware: new RequestIdMiddleware(requestContext, logger),
    requestContext,
  };
}

describe("RequestIdMiddleware", () => {
  it("reuses a valid incoming request ID and exposes it on the response", () => {
    const { logger, middleware, requestContext } = createMiddleware();
    const request = {
      headers: { "x-request-id": "req-client-123" },
      method: "GET",
      path: "/health/live",
    };
    const response: TestResponse = Object.assign(new EventEmitter(), {
      setHeader: jest.fn(),
      locals: {},
      statusCode: 200,
    });
    const next = jest.fn(() => {
      expect(requestContext.getRequestId()).toBe("req-client-123");
    });
    const log = jest.spyOn(logger, "log").mockImplementation();

    middleware.use(request as never, response as never, next);

    expect(response.locals).toEqual({ requestId: "req-client-123" });
    expect(response.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "req-client-123",
    );
    expect(next).toHaveBeenCalledTimes(1);
    response.emit("finish");
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "http.request.completed",
        method: "GET",
        path: "/health/live",
        requestId: "req-client-123",
        statusCode: 200,
      }),
      RequestIdMiddleware.name,
    );
  });

  it("replaces an invalid incoming request ID", () => {
    const { middleware } = createMiddleware();
    const request = {
      headers: { "x-request-id": "not valid!" },
      method: "GET",
      path: "/health/live",
    };
    const response: TestResponse = Object.assign(new EventEmitter(), {
      setHeader: jest.fn(),
      locals: {},
      statusCode: 200,
    });

    middleware.use(request as never, response as never, jest.fn());

    expect(response.locals.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
  });
});
