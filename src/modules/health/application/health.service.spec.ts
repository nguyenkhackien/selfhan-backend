import { ServiceUnavailableException } from "@nestjs/common";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("reports liveness without querying a dependency", () => {
    const database = { query: jest.fn() };
    const service = new HealthService(database as never);

    expect(service.live()).toEqual({ status: "ok" });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("reports readiness after the database accepts a lightweight query", async () => {
    const database = {
      query: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    };
    const service = new HealthService(database as never);

    await expect(service.ready()).resolves.toEqual({
      status: "ok",
      database: "up",
    });
    expect(database.query).toHaveBeenCalledWith("SELECT 1");
  });

  it("returns a safe unavailable response when the database is unreachable", async () => {
    const database = {
      query: jest.fn().mockRejectedValue(new Error("connection refused")),
    };
    const service = new HealthService(database as never);

    await expect(service.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
