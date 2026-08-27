import { ContentStatus } from "./level.entity";

export interface Vocabulary {
  id: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVocabularyInput {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  audioUrl: string | null;
  status: ContentStatus;
}
