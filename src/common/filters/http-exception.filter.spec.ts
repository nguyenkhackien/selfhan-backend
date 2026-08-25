import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  it("maps a validation exception to the standard safe error envelope", () => {
    const filter = new HttpExceptionFilter();
    const status = jest.fn();
    const json = jest.fn();
    const host = {
      switchToHttp: (): {
        getRequest: () => { requestId: string };
        getResponse: () => unknown;
      } => ({
        getRequest: (): { requestId: string } => ({ requestId: "req-123" }),
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
  });
});
