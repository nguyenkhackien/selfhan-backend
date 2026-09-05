import { validateEnvironment } from "./env.validation";

describe("Environment Validation", () => {
  const validEnv = {
    NODE_ENV: "development",
    PORT: "3000",
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nestjs_base",
    JWT_ACCESS_SECRET: "test-access-secret-key-at-least-32-characters",
    JWT_ACCESS_EXPIRATION: "15m",
    FRONTEND_ORIGIN: "http://localhost:3001",
  };

  it("should validate valid environment", () => {
    const result = validateEnvironment(validEnv);
    expect(result).toBeDefined();
    expect(result.NODE_ENV).toBe("development");
    expect(result.PORT).toBe(3000);
    expect(result.LOG_LEVEL).toBe("trace");
  });

  it("should fail with short JWT_ACCESS_SECRET", () => {
    expect(() =>
      validateEnvironment({
        ...validEnv,
        JWT_ACCESS_SECRET: "short",
      }),
    ).toThrow();
  });

  it("should fail with invalid FRONTEND_ORIGIN", () => {
    expect(() =>
      validateEnvironment({
        ...validEnv,
        FRONTEND_ORIGIN: "not-a-url",
      }),
    ).toThrow();
  });

  it("should fail with missing DATABASE_URL", () => {
    expect(() =>
      validateEnvironment({
        ...validEnv,
        DATABASE_URL: undefined,
      }),
    ).toThrow();
  });

  it("should fail with an unsupported logging level", () => {
    expect(() =>
      validateEnvironment({ ...validEnv, LOG_LEVEL: "loud" }),
    ).toThrow();
  });
});
