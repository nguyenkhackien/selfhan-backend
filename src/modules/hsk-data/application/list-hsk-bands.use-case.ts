import { Injectable } from "@nestjs/common";
import type { HskBandSummary } from "../domain/hsk-vocabulary";
import { HskVocabularyRepositoryPort } from "./hsk-vocabulary.ports";

@Injectable()
export class ListHskBandsUseCase {
  constructor(private readonly repository: HskVocabularyRepositoryPort) {}

  async execute(): Promise<readonly HskBandSummary[]> {
    return this.repository.listBands();
  }
}
