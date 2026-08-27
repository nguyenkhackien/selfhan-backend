import { Injectable, NotFoundException } from "@nestjs/common";
import { Lesson } from "../domain/lesson.entity";
import { ContentStatus } from "../domain/level.entity";
import { Vocabulary } from "../domain/vocabulary.entity";
import { ExampleSentence } from "../domain/example-sentence.entity";
import { GrammarPoint } from "../domain/grammar-point.entity";
import {
  LevelRepositoryPort,
  UnitRepositoryPort,
  LessonRepositoryPort,
  LessonVocabularyRepositoryPort,
  VocabularyRepositoryPort,
  ExampleSentenceRepositoryPort,
  GrammarPointRepositoryPort,
} from "./curriculum.ports";

export interface VocabularyWithExamples extends Vocabulary {
  exampleSentences: ExampleSentence[];
}

export interface GetLessonBySlugOutput {
  lesson: Lesson;
  vocabulary: VocabularyWithExamples[];
  grammarPoints: GrammarPoint[];
}

@Injectable()
export class GetLessonBySlugUseCase {
  constructor(
    private readonly levelRepo: LevelRepositoryPort,
    private readonly unitRepo: UnitRepositoryPort,
    private readonly lessonRepo: LessonRepositoryPort,
    private readonly lessonVocabRepo: LessonVocabularyRepositoryPort,
    private readonly vocabRepo: VocabularyRepositoryPort,
    private readonly exampleSentenceRepo: ExampleSentenceRepositoryPort,
    private readonly grammarPointRepo: GrammarPointRepositoryPort,
  ) {}

  async execute(slug: string): Promise<GetLessonBySlugOutput> {
    const lesson = await this.lessonRepo.findBySlug(slug);

    const unit = lesson ? await this.unitRepo.findById(lesson.unitId) : null;
    const level = unit ? await this.levelRepo.findById(unit.levelId) : null;
    if (
      !lesson ||
      lesson.status !== ContentStatus.PUBLISHED ||
      !unit ||
      unit.status !== ContentStatus.PUBLISHED ||
      !level ||
      level.status !== ContentStatus.PUBLISHED
    ) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Lesson not found.",
      });
    }

    const lessonVocabularies = await this.lessonVocabRepo.findByLessonId(
      lesson.id,
    );

    const sortedLessonVocabs = lessonVocabularies.sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const vocabularyIds = sortedLessonVocabs.map((lv) => lv.vocabularyId);

    const allVocabulary =
      vocabularyIds.length > 0
        ? await this.vocabRepo.findByIds(vocabularyIds)
        : [];

    const publishedVocabulary = allVocabulary.filter(
      (v) => v.status === ContentStatus.PUBLISHED,
    );

    const allExamples =
      vocabularyIds.length > 0
        ? await this.exampleSentenceRepo.findByVocabularyIds(vocabularyIds)
        : [];

    const vocabularyById = new Map(
      publishedVocabulary.map((vocabulary) => [vocabulary.id, vocabulary]),
    );
    const vocabularyWithExamples: VocabularyWithExamples[] = sortedLessonVocabs
      .map((lessonVocabulary) =>
        vocabularyById.get(lessonVocabulary.vocabularyId),
      )
      .filter(
        (vocabulary): vocabulary is Vocabulary => vocabulary !== undefined,
      )
      .map((vocabulary) => ({
        ...vocabulary,
        exampleSentences: allExamples
          .filter((example) => example.vocabularyId === vocabulary.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));

    const grammarPoints = await this.grammarPointRepo.findByLessonId(lesson.id);

    return {
      lesson,
      vocabulary: vocabularyWithExamples,
      grammarPoints: grammarPoints.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }
}
