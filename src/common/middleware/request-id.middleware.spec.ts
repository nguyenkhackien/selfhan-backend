import { RequestIdMiddleware } from "./request-id.middleware";

describe("RequestIdMiddleware", () => {
  it("reuses a valid incoming request ID and exposes it on the response", () => {
    const middleware = new RequestIdMiddleware();
    const request = { headers: { "x-request-id": "req-client-123" } };
    const response: { setHeader: jest.Mock; locals: Record<string, string> } = {
      setHeader: jest.fn(),
      locals: {},
    };
    const next = jest.fn();

    middleware.use(request as never, response as never, next);

    expect(response.locals).toEqual({ requestId: "req-client-123" });
    expect(response.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "req-client-123",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("replaces an invalid incoming request ID", () => {
    const middleware = new RequestIdMiddleware();
    const request = { headers: { "x-request-id": "not valid!" } };
    const response: { setHeader: jest.Mock; locals: Record<string, string> } = {
      setHeader: jest.fn(),
      locals: {},
    };

    middleware.use(request as never, response as never, jest.fn());

    expect(response.locals.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
  });
});
