import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JsonLoggerService } from "../../infrastructure/logging/json-logger.service";
import { HttpExceptionFilter } from "./http-exception.filter";

function createLogger(): jest.Mocked<
  Pick<JsonLoggerService, "error" | "warn">
> {
  return {
    error: jest.fn(),
    warn: jest.fn(),
  };
}

describe("HttpExceptionFilter", () => {
  it("resolves JsonLoggerService through Nest dependency injection", async () => {
    const logger = createLogger();

    await expect(
      Test.createTestingModule({
        providers: [
          HttpExceptionFilter,
          { provide: JsonLoggerService, useValue: logger },
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it("maps a validation exception to the standard safe error envelope", () => {
    const logger = createLogger();
    const filter = new HttpExceptionFilter(logger);
    const status = jest.fn();
    const json = jest.fn();
    const host = {
      switchToHttp: (): {
        getRequest: () => { method: string; path: string; requestId: string };
        getResponse: () => unknown;
      } => ({
        getRequest: (): {
          method: string;
          path: string;
          requestId: string;
        } => ({
          method: "POST",
          path: "/api/v1/auth/login",
          requestId: "req-123",
        }),
        getResponse: (): unknown => ({
          status: status.mockReturnValue({ json }),
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new HttpException(
        { message: ["email must be an email"], error: "Bad Request" },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: ["email must be an email"],
        requestId: "req-123",
      },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        event: "http.request.failed",
        requestId: "req-123",
        statusCode: HttpStatus.BAD_REQUEST,
      }),
      HttpExceptionFilter.name,
    );
  });

  it("logs unexpected failures once without exposing their message", () => {
    const logger = createLogger();
    const filter = new HttpExceptionFilter(logger);
    const status = jest.fn();
    const json = jest.fn();
    const host = {
      switchToHttp: (): {
        getRequest: () => { method: string; path: string; requestId: string };
        getResponse: () => unknown;
      } => ({
        getRequest: (): {
          method: string;
          path: string;
          requestId: string;
        } => ({
          method: "GET",
          path: "/api/v1/health/ready",
          requestId: "req-500",
        }),
        getResponse: (): unknown => ({
          status: status.mockReturnValue({ json }),
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error("database password leaked"), host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INTERNAL_ERROR",
        errorName: "Error",
        event: "http.request.failed",
        requestId: "req-500",
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
      HttpExceptionFilter.name,
    );
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        details: null,
        message: "An unexpected error occurred.",
        requestId: "req-500",
      },
    });
  });
});
