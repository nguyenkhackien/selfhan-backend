import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonVocabularyRepositoryPort } from "../../application/curriculum.ports";
import { LessonVocabulary } from "../../domain/lesson-vocabulary.entity";
import { LessonVocabularyOrmEntity } from "./lesson-vocabulary.orm-entity";

@Injectable()
export class LessonVocabularyRepositoryAdapter implements LessonVocabularyRepositoryPort {
  constructor(
    @InjectRepository(LessonVocabularyOrmEntity)
    private readonly repository: Repository<LessonVocabularyOrmEntity>,
  ) {}

  async findByLessonId(lessonId: string): Promise<LessonVocabulary[]> {
    const entities = await this.repository.find({
      where: { lessonId },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: LessonVocabularyOrmEntity): LessonVocabulary {
    return {
      id: entity.id,
      lessonId: entity.lessonId,
      vocabularyId: entity.vocabularyId,
      sortOrder: entity.sortOrder,
    };
  }
}
