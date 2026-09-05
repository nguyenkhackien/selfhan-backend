import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Response } from "express";
import { JsonLoggerService } from "../../infrastructure/logging/json-logger.service";
import { RequestContextService } from "../request-context/request-context.service";
import { RequestWithContext } from "../types/request-context.type";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly logger: JsonLoggerService,
  ) {}

  use(
    request: RequestWithContext,
    response: Response,
    next: NextFunction,
  ): void {
    const incomingRequestId = request.headers["x-request-id"];
    const candidate = Array.isArray(incomingRequestId)
      ? incomingRequestId[0]
      : incomingRequestId;
    const requestId =
      candidate !== undefined && REQUEST_ID_PATTERN.test(candidate)
        ? candidate
        : `req_${randomUUID()}`;

    request.requestId = requestId;
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    const startedAt = process.hrtime.bigint();

    response.once("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      this.logger.log(
        {
          durationMs: Math.round(durationMs * 100) / 100,
          event: "http.request.completed",
          method: request.method,
          path: request.path,
          requestId,
          statusCode: response.statusCode,
        },
        RequestIdMiddleware.name,
      );
    });

    this.requestContext.run({ requestId }, next);
  }
}
