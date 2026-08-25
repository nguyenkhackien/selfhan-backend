import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { RequestWithContext } from "../types/request-context.type";

type ResponseLocals = { requestId?: string };

type HttpExceptionBody = {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithContext>();
    const response = context.getResponse<Response<unknown, ResponseLocals>>();
    const requestId =
      request.requestId ?? response.locals.requestId ?? "unknown";

    if (!(exception instanceof HttpException)) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
          details: null,
          requestId,
        },
      });
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    const normalizedBody = this.normalizeBody(body);
    const isValidationError =
      status === 400 && Array.isArray(normalizedBody.message);

    response.status(status).json({
      error: {
        code:
          normalizedBody.code ??
          (isValidationError ? "VALIDATION_ERROR" : this.codeForStatus(status)),
        message: isValidationError
          ? "Request validation failed."
          : this.messageForStatus(status),
        details: isValidationError
          ? normalizedBody.message
          : (normalizedBody.details ?? null),
        requestId,
      },
    });
  }

  private codeForStatus(status: number): string {
    const codeByStatus: Partial<Record<number, string>> = {
      [HttpStatus.UNAUTHORIZED]: "UNAUTHENTICATED",
      [HttpStatus.FORBIDDEN]: "FORBIDDEN",
      [HttpStatus.NOT_FOUND]: "NOT_FOUND",
      [HttpStatus.CONFLICT]: "CONFLICT",
      [HttpStatus.TOO_MANY_REQUESTS]: "RATE_LIMITED",
    };

    return codeByStatus[status] ?? "REQUEST_ERROR";
  }

  private messageForStatus(status: number): string {
    if (status >= 500) {
      return "An unexpected error occurred.";
    }

    return "The request could not be processed.";
  }

  private normalizeBody(body: string | object): HttpExceptionBody {
    if (typeof body === "string") {
      return { message: body };
    }

    if (!this.isRecord(body)) {
      return {};
    }

    return {
      message:
        typeof body.message === "string" ||
        (Array.isArray(body.message) &&
          body.message.every((item) => typeof item === "string"))
          ? body.message
          : undefined,
      error: typeof body.error === "string" ? body.error : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
      details: body.details,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}
