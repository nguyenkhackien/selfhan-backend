import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  it("returns normalized configuration for valid environment values", () => {
    expect(
      validateEnvironment({
        NODE_ENV: "test",
        PORT: "3100",
        DATABASE_URL:
          "postgres://postgres:postgres@localhost:5432/nestjs_base_test",
      }),
    ).toEqual({
      NODE_ENV: "test",
      PORT: 3100,
      DATABASE_URL:
        "postgres://postgres:postgres@localhost:5432/nestjs_base_test",
    });
  });

  it("rejects missing database URLs during startup", () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: "test", PORT: "3000" }),
    ).toThrow("Invalid environment configuration");
  });
});
