import { Injectable, NotFoundException } from "@nestjs/common";
import { LevelRepositoryPort, UnitRepositoryPort } from "./curriculum.ports";
import { ContentStatus, Level } from "../domain/level.entity";
import { Unit } from "../domain/unit.entity";

export interface LevelDetailOutput extends Level {
  units: Unit[];
}

@Injectable()
export class GetLevelDetailUseCase {
  constructor(
    private readonly levelRepository: LevelRepositoryPort,
    private readonly unitRepository: UnitRepositoryPort,
  ) {}

  async execute(slug: string): Promise<LevelDetailOutput> {
    const level = await this.levelRepository.findBySlug(slug);

    if (!level || level.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Level not found.",
      });
    }

    const units = await this.unitRepository.findPublishedByLevelId(level.id);

    return {
      ...level,
      units,
    };
  }
}
