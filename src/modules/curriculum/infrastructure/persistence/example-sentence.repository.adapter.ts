import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ExampleSentenceRepositoryPort } from "../../application/curriculum.ports";
import { ExampleSentence } from "../../domain/example-sentence.entity";
import { ExampleSentenceOrmEntity } from "./example-sentence.orm-entity";

@Injectable()
export class ExampleSentenceRepositoryAdapter implements ExampleSentenceRepositoryPort {
  constructor(
    @InjectRepository(ExampleSentenceOrmEntity)
    private readonly repository: Repository<ExampleSentenceOrmEntity>,
  ) {}

  async findByVocabularyIds(
    vocabularyIds: string[],
  ): Promise<ExampleSentence[]> {
    if (vocabularyIds.length === 0) return [];
    const entities = await this.repository.find({
      where: { vocabularyId: In(vocabularyIds) },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: ExampleSentenceOrmEntity): ExampleSentence {
    return {
      id: entity.id,
      vocabularyId: entity.vocabularyId,
      hanzi: entity.hanzi,
      pinyin: entity.pinyin,
      meaningVi: entity.meaningVi,
      audioUrl: entity.audioUrl,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
