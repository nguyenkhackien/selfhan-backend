import type {
  HskBandSummary,
  HskVocabularyCursor,
  HskVocabularyDetail,
  HskVocabularySummary,
} from "../domain/hsk-vocabulary";

export interface ListHskVocabularyQuery {
  readonly band: number | null;
  readonly query: string | null;
  readonly cursor: HskVocabularyCursor | null;
  readonly limit: number;
}

export abstract class HskVocabularyRepositoryPort {
  abstract listBands(): Promise<readonly HskBandSummary[]>;
  abstract list(
    query: ListHskVocabularyQuery,
  ): Promise<readonly HskVocabularySummary[]>;
  abstract findById(id: string): Promise<HskVocabularyDetail | null>;
}
