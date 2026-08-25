import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { DataSource } from "typeorm";

export type LivenessResponse = { status: "ok" };
export type ReadinessResponse = LivenessResponse & { database: "up" };

@Injectable()
export class HealthService {
  constructor(private readonly database: DataSource) {}

  live(): LivenessResponse {
    return { status: "ok" };
  }

  async ready(): Promise<ReadinessResponse> {
    try {
      await this.database.query("SELECT 1");
      return { status: "ok", database: "up" };
    } catch (cause) {
      throw new ServiceUnavailableException(
        {
          code: "DEPENDENCY_UNAVAILABLE",
          details: null,
        },
        { cause },
      );
    }
  }
}
