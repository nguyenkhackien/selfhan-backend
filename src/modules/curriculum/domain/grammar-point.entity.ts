export interface GrammarPoint {
  id: string;
  lessonId: string;
  title: string;
  explanationVi: string;
  examplesJson: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGrammarPointInput {
  lessonId: string;
  title: string;
  explanationVi: string;
  examplesJson: string[];
  sortOrder: number;
}
