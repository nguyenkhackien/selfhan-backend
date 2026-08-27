export interface ExampleSentence {
  id: string;
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExampleSentenceInput {
  vocabularyId: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  sortOrder: number;
}
