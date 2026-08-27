import { Level } from "../domain/level.entity";
import { Unit } from "../domain/unit.entity";
import { Lesson } from "../domain/lesson.entity";
import { Vocabulary } from "../domain/vocabulary.entity";
import { LessonVocabulary } from "../domain/lesson-vocabulary.entity";
import { ExampleSentence } from "../domain/example-sentence.entity";
import { GrammarPoint } from "../domain/grammar-point.entity";

export abstract class LevelRepositoryPort {
  abstract findBySlug(slug: string): Promise<Level | null>;
  abstract findById(id: string): Promise<Level | null>;
  abstract findPublished(): Promise<Level[]>;
}

export abstract class UnitRepositoryPort {
  abstract findBySlug(slug: string): Promise<Unit | null>;
  abstract findById(id: string): Promise<Unit | null>;
  abstract findPublishedByLevelId(levelId: string): Promise<Unit[]>;
}

export abstract class LessonRepositoryPort {
  abstract findBySlug(slug: string): Promise<Lesson | null>;
  abstract findPublishedByUnitId(unitId: string): Promise<Lesson[]>;
}

export abstract class VocabularyRepositoryPort {
  abstract findByIds(ids: string[]): Promise<Vocabulary[]>;
}

export abstract class LessonVocabularyRepositoryPort {
  abstract findByLessonId(lessonId: string): Promise<LessonVocabulary[]>;
}

export abstract class ExampleSentenceRepositoryPort {
  abstract findByVocabularyIds(
    vocabularyIds: string[],
  ): Promise<ExampleSentence[]>;
}

export abstract class GrammarPointRepositoryPort {
  abstract findByLessonId(lessonId: string): Promise<GrammarPoint[]>;
}
