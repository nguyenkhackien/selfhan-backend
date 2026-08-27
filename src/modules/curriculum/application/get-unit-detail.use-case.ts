import { Injectable, NotFoundException } from "@nestjs/common";
import {
  UnitRepositoryPort,
  LevelRepositoryPort,
  LessonRepositoryPort,
} from "./curriculum.ports";
import { Unit } from "../domain/unit.entity";
import { ContentStatus, Level } from "../domain/level.entity";
import { Lesson } from "../domain/lesson.entity";

export interface UnitDetailOutput extends Unit {
  level: Pick<Level, "id" | "title" | "slug">;
  lessons: Lesson[];
}

@Injectable()
export class GetUnitDetailUseCase {
  constructor(
    private readonly unitRepository: UnitRepositoryPort,
    private readonly levelRepository: LevelRepositoryPort,
    private readonly lessonRepository: LessonRepositoryPort,
  ) {}

  async execute(slug: string): Promise<UnitDetailOutput> {
    const unit = await this.unitRepository.findBySlug(slug);

    if (!unit || unit.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Unit not found.",
      });
    }

    const level = await this.levelRepository.findById(unit.levelId);

    const lessons = await this.lessonRepository.findPublishedByUnitId(unit.id);

    return {
      ...unit,
      level: level
        ? { id: level.id, title: level.title, slug: level.slug }
        : { id: unit.levelId, title: "", slug: "" },
      lessons,
    };
  }
}
