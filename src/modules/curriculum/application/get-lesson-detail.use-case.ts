import { Injectable, NotFoundException } from "@nestjs/common";
import {
  LessonRepositoryPort,
  UnitRepositoryPort,
  LessonVocabularyRepositoryPort,
  VocabularyRepositoryPort,
  ExampleSentenceRepositoryPort,
  GrammarPointRepositoryPort,
} from "./curriculum.ports";
import { Lesson } from "../domain/lesson.entity";
import { ContentStatus } from "../domain/level.entity";
import { Unit } from "../domain/unit.entity";
import { Vocabulary } from "../domain/vocabulary.entity";
import { ExampleSentence } from "../domain/example-sentence.entity";
import { GrammarPoint } from "../domain/grammar-point.entity";

export interface LessonVocabularyItem {
  sortOrder: number;
  vocabulary: Vocabulary;
  examples: ExampleSentence[];
}

export interface LessonDetailOutput extends Lesson {
  unit: Pick<Unit, "id" | "title" | "slug">;
  vocabulary: LessonVocabularyItem[];
  grammarPoints: GrammarPoint[];
}

@Injectable()
export class GetLessonDetailUseCase {
  constructor(
    private readonly lessonRepository: LessonRepositoryPort,
    private readonly unitRepository: UnitRepositoryPort,
    private readonly lessonVocabularyRepository: LessonVocabularyRepositoryPort,
    private readonly vocabularyRepository: VocabularyRepositoryPort,
    private readonly exampleSentenceRepository: ExampleSentenceRepositoryPort,
    private readonly grammarPointRepository: GrammarPointRepositoryPort,
  ) {}

  async execute(slug: string): Promise<LessonDetailOutput> {
    const lesson = await this.lessonRepository.findBySlug(slug);

    if (!lesson || lesson.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Lesson not found.",
      });
    }

    const unit = await this.unitRepository.findBySlug("");

    const lessonVocabularies =
      await this.lessonVocabularyRepository.findByLessonId(lesson.id);

    const vocabularyIds = lessonVocabularies.map((lv) => lv.vocabularyId);
    const vocabularies =
      await this.vocabularyRepository.findByIds(vocabularyIds);

    const vocabularyMap = new Map(vocabularies.map((v) => [v.id, v]));

    const publishedVocabularies = vocabularies.filter(
      (v) => v.status === ContentStatus.PUBLISHED,
    );

    const publishedVocabularyIds = publishedVocabularies.map((v) => v.id);

    const allExamples =
      await this.exampleSentenceRepository.findByVocabularyIds(
        publishedVocabularyIds,
      );

    const examplesByVocabulary = new Map<string, ExampleSentence[]>();
    for (const example of allExamples) {
      const existing = examplesByVocabulary.get(example.vocabularyId) ?? [];
      existing.push(example);
      examplesByVocabulary.set(example.vocabularyId, existing);
    }

    const vocabularyItems: LessonVocabularyItem[] = lessonVocabularies
      .filter((lv) => {
        const vocab = vocabularyMap.get(lv.vocabularyId);
        return vocab && vocab.status === ContentStatus.PUBLISHED;
      })
      .map((lv) => ({
        sortOrder: lv.sortOrder,
        vocabulary: vocabularyMap.get(lv.vocabularyId)!,
        examples: examplesByVocabulary.get(lv.vocabularyId) ?? [],
      }));

    const grammarPoints = await this.grammarPointRepository.findByLessonId(
      lesson.id,
    );

    return {
      ...lesson,
      unit: unit
        ? { id: unit.id, title: unit.title, slug: unit.slug }
        : { id: lesson.unitId, title: "", slug: "" },
      vocabulary: vocabularyItems,
      grammarPoints,
    };
  }
}
