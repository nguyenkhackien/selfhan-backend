import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export type RequestLogContext = Readonly<{
  requestId: string;
}>;

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestLogContext>();

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  run<T>(context: RequestLogContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }
}
