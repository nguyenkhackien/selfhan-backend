export type HskVocabularyImportStatus = "ready" | "needs_review";

export interface HskBandSummary {
  readonly band: number;
  readonly displayBand: string;
  readonly count: number;
}

export interface HskVocabularySummary {
  readonly id: string;
  readonly hskBand: number;
  readonly sourceOrder: number;
  readonly simplified: string;
  readonly pinyin: string;
  readonly sinoViet: string | null;
  readonly primaryMeaning: string | null;
  readonly importStatus: HskVocabularyImportStatus;
}

export interface HskVocabularyDetail extends HskVocabularySummary {
  readonly traditional: string | null;
  readonly frequency: number | null;
  readonly senses: readonly string[];
}

export interface HskVocabularyCursor {
  readonly hskBand: number;
  readonly sourceOrder: number;
  readonly id: string;
}
