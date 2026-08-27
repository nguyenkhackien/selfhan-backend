import { Injectable } from "@nestjs/common";
import { Level } from "../domain/level.entity";
import { LevelRepositoryPort } from "./curriculum.ports";
export interface ListLevelsOutput {
  levels: Level[];
}

@Injectable()
export class ListLevelsUseCase {
  constructor(private readonly levelRepo: LevelRepositoryPort) {}

  async execute(): Promise<ListLevelsOutput> {
    return { levels: await this.levelRepo.findPublished() };
  }
}
