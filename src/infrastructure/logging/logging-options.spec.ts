import { Environment } from "../../config/env.validation";
import { createLoggingOptions, LoggingConfigReader } from "./logging-options";

class TestLoggingConfig implements LoggingConfigReader {
  constructor(
    private readonly values: Pick<
      Environment,
      "LOG_FORMAT" | "LOG_LEVEL" | "NODE_ENV"
    >,
  ) {}

  get(key: "LOG_FORMAT"): Environment["LOG_FORMAT"] {
    return this.values[key];
  }

  getOrThrow(key: "NODE_ENV"): Environment["NODE_ENV"];
  getOrThrow(key: "LOG_LEVEL"): Environment["LOG_LEVEL"];
  getOrThrow(
    key: "NODE_ENV" | "LOG_LEVEL",
  ): Environment["NODE_ENV"] | Environment["LOG_LEVEL"] {
    return this.values[key];
  }
}

function configFor(
  values: Pick<Environment, "LOG_FORMAT" | "LOG_LEVEL" | "NODE_ENV">,
): LoggingConfigReader {
  return new TestLoggingConfig(values);
}

describe("createLoggingOptions", () => {
  it("uses coloured development output and the configured threshold", () => {
    expect(
      createLoggingOptions(
        configFor({
          LOG_FORMAT: undefined,
          LOG_LEVEL: "debug",
          NODE_ENV: "development",
        }),
      ),
    ).toEqual({ format: "pretty", minimumLevel: "debug" });
  });

  it("uses JSON output by default in production", () => {
    expect(
      createLoggingOptions(
        configFor({
          LOG_FORMAT: undefined,
          LOG_LEVEL: "info",
          NODE_ENV: "production",
        }),
      ),
    ).toEqual({ format: "json", minimumLevel: "info" });
  });
});
