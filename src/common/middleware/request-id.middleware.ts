import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Response } from "express";
import { RequestWithContext } from "../types/request-context.type";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
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
    next();
  }
}
