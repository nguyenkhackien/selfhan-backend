import { Module } from "@nestjs/common";
import { LearningStateController } from "./learning-state.controller";
import { LearningStateService } from "./learning-state.service";

@Module({
  controllers: [LearningStateController],
  providers: [LearningStateService],
})
export class LearningStateModule {}
