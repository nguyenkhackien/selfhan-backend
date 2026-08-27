import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Level } from "../domain/level.entity";
import { Unit } from "../domain/unit.entity";
import { LevelRepositoryPort, UnitRepositoryPort } from "./curriculum.ports";

export interface GetLevelBySlugOutput {
  level: Level;
  units: Unit[];
}

@Injectable()
export class GetLevelBySlugUseCase {
  constructor(
    private readonly levelRepo: LevelRepositoryPort,
    private readonly unitRepo: UnitRepositoryPort,
  ) {}

  async execute(slug: string): Promise<GetLevelBySlugOutput> {
    const level = await this.levelRepo.findBySlug(slug);

    if (!level || level.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Level not found.",
      });
    }

    return {
      level,
      units: await this.unitRepo.findPublishedByLevelId(level.id),
    };
  }
}
