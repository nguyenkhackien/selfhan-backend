import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus } from "../domain/level.entity";
import { Unit } from "../domain/unit.entity";
import { Lesson } from "../domain/lesson.entity";
import {
  LevelRepositoryPort,
  UnitRepositoryPort,
  LessonRepositoryPort,
} from "./curriculum.ports";

export interface GetUnitBySlugOutput {
  unit: Unit;
  lessons: Lesson[];
}

@Injectable()
export class GetUnitBySlugUseCase {
  constructor(
    private readonly levelRepo: LevelRepositoryPort,
    private readonly unitRepo: UnitRepositoryPort,
    private readonly lessonRepo: LessonRepositoryPort,
  ) {}

  async execute(slug: string): Promise<GetUnitBySlugOutput> {
    const unit = await this.unitRepo.findBySlug(slug);

    const level = unit ? await this.levelRepo.findById(unit.levelId) : null;
    if (
      !unit ||
      unit.status !== ContentStatus.PUBLISHED ||
      !level ||
      level.status !== ContentStatus.PUBLISHED
    ) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Unit not found.",
      });
    }

    const lessons = await this.lessonRepo.findPublishedByUnitId(unit.id);

    return { unit, lessons };
  }
}
