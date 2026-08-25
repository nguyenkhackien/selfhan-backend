import { JsonLoggerService } from "./json-logger.service";

describe("JsonLoggerService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redacts sensitive values before writing structured logs", () => {
    const write = jest.spyOn(console, "log").mockImplementation();
    const logger = new JsonLoggerService();

    logger.log(
      { authorization: "Bearer secret", password: "hidden", userId: "user-1" },
      "Login",
    );

    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"authorization":"[REDACTED]"'),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"password":"[REDACTED]"'),
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('"userId":"user-1"'),
    );
  });
});
