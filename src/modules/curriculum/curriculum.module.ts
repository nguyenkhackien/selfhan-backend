import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LevelOrmEntity } from "./infrastructure/persistence/level.orm-entity";
import { UnitOrmEntity } from "./infrastructure/persistence/unit.orm-entity";
import { LessonOrmEntity } from "./infrastructure/persistence/lesson.orm-entity";
import { VocabularyOrmEntity } from "./infrastructure/persistence/vocabulary.orm-entity";
import { LessonVocabularyOrmEntity } from "./infrastructure/persistence/lesson-vocabulary.orm-entity";
import { ExampleSentenceOrmEntity } from "./infrastructure/persistence/example-sentence.orm-entity";
import { GrammarPointOrmEntity } from "./infrastructure/persistence/grammar-point.orm-entity";
import { LevelRepositoryAdapter } from "./infrastructure/persistence/level.repository.adapter";
import { UnitRepositoryAdapter } from "./infrastructure/persistence/unit.repository.adapter";
import { LessonRepositoryAdapter } from "./infrastructure/persistence/lesson.repository.adapter";
import { VocabularyRepositoryAdapter } from "./infrastructure/persistence/vocabulary.repository.adapter";
import { LessonVocabularyRepositoryAdapter } from "./infrastructure/persistence/lesson-vocabulary.repository.adapter";
import { ExampleSentenceRepositoryAdapter } from "./infrastructure/persistence/example-sentence.repository.adapter";
import { GrammarPointRepositoryAdapter } from "./infrastructure/persistence/grammar-point.repository.adapter";
import {
  LevelRepositoryPort,
  UnitRepositoryPort,
  LessonRepositoryPort,
  VocabularyRepositoryPort,
  LessonVocabularyRepositoryPort,
  ExampleSentenceRepositoryPort,
  GrammarPointRepositoryPort,
} from "./application/curriculum.ports";
import { CurriculumController } from "./presentation/curriculum.controller";
import { ListLevelsUseCase } from "./application/list-levels.use-case";
import { GetLevelBySlugUseCase } from "./application/get-level-by-slug.use-case";
import { GetUnitBySlugUseCase } from "./application/get-unit-by-slug.use-case";
import { GetLessonBySlugUseCase } from "./application/get-lesson-by-slug.use-case";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LevelOrmEntity,
      UnitOrmEntity,
      LessonOrmEntity,
      VocabularyOrmEntity,
      LessonVocabularyOrmEntity,
      ExampleSentenceOrmEntity,
      GrammarPointOrmEntity,
    ]),
  ],
  controllers: [CurriculumController],
  providers: [
    {
      provide: LevelRepositoryPort,
      useClass: LevelRepositoryAdapter,
    },
    {
      provide: UnitRepositoryPort,
      useClass: UnitRepositoryAdapter,
    },
    {
      provide: LessonRepositoryPort,
      useClass: LessonRepositoryAdapter,
    },
    {
      provide: VocabularyRepositoryPort,
      useClass: VocabularyRepositoryAdapter,
    },
    {
      provide: LessonVocabularyRepositoryPort,
      useClass: LessonVocabularyRepositoryAdapter,
    },
    {
      provide: ExampleSentenceRepositoryPort,
      useClass: ExampleSentenceRepositoryAdapter,
    },
    {
      provide: GrammarPointRepositoryPort,
      useClass: GrammarPointRepositoryAdapter,
    },
    ListLevelsUseCase,
    GetLevelBySlugUseCase,
    GetUnitBySlugUseCase,
    GetLessonBySlugUseCase,
  ],
  exports: [
    LevelRepositoryPort,
    UnitRepositoryPort,
    LessonRepositoryPort,
    VocabularyRepositoryPort,
    LessonVocabularyRepositoryPort,
    ExampleSentenceRepositoryPort,
    GrammarPointRepositoryPort,
  ],
})
export class CurriculumModule {}
