import { Controller, Get } from "@nestjs/common";
import {
  HealthService,
  LivenessResponse,
  ReadinessResponse,
} from "../application/health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  live(): LivenessResponse {
    return this.health.live();
  }

  @Get("ready")
  ready(): Promise<ReadinessResponse> {
    return this.health.ready();
  }
}
