import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HskCharacterReadingOrmEntity } from "./infrastructure/persistence/hsk-character-reading.orm-entity";
import { HskVocabularySenseOrmEntity } from "./infrastructure/persistence/hsk-vocabulary-sense.orm-entity";
import { HskVocabularyOrmEntity } from "./infrastructure/persistence/hsk-vocabulary.orm-entity";
import { HskVocabularyRepositoryPort } from "./application/hsk-vocabulary.ports";
import { HskVocabularyRepositoryAdapter } from "./infrastructure/persistence/hsk-vocabulary.repository.adapter";
import { ListHskBandsUseCase } from "./application/list-hsk-bands.use-case";
import { ListHskVocabularyUseCase } from "./application/list-hsk-vocabulary.use-case";
import { GetHskVocabularyUseCase } from "./application/get-hsk-vocabulary.use-case";
import { HskVocabularyController } from "./presentation/hsk-vocabulary.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HskVocabularyOrmEntity,
      HskVocabularySenseOrmEntity,
      HskCharacterReadingOrmEntity,
    ]),
  ],
  controllers: [HskVocabularyController],
  providers: [
    {
      provide: HskVocabularyRepositoryPort,
      useClass: HskVocabularyRepositoryAdapter,
    },
    ListHskBandsUseCase,
    ListHskVocabularyUseCase,
    GetHskVocabularyUseCase,
  ],
})
export class HskDataModule {}
