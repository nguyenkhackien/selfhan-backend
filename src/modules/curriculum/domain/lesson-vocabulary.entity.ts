export interface LessonVocabulary {
  id: string;
  lessonId: string;
  vocabularyId: string;
  sortOrder: number;
}

export interface CreateLessonVocabularyInput {
  lessonId: string;
  vocabularyId: string;
  sortOrder: number;
}
