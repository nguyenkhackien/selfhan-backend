import { Injectable } from "@nestjs/common";
import { LevelRepositoryPort } from "./curriculum.ports";
import { Level } from "../domain/level.entity";

@Injectable()
export class GetPublishedLevelsUseCase {
  constructor(private readonly levelRepository: LevelRepositoryPort) {}

  async execute(): Promise<Level[]> {
    return this.levelRepository.findPublished();
  }
}
