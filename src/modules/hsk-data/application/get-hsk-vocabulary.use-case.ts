import { Injectable, NotFoundException } from "@nestjs/common";
import type { HskVocabularyDetail } from "../domain/hsk-vocabulary";
import { HskVocabularyRepositoryPort } from "./hsk-vocabulary.ports";

@Injectable()
export class GetHskVocabularyUseCase {
  constructor(private readonly repository: HskVocabularyRepositoryPort) {}

  async execute(id: string): Promise<HskVocabularyDetail> {
    const vocabulary = await this.repository.findById(id);
    if (vocabulary === null) {
      throw new NotFoundException("HSK vocabulary was not found.");
    }

    return vocabulary;
  }
}
