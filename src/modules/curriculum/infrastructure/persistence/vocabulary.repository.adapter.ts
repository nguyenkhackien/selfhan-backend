import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { VocabularyRepositoryPort } from "../../application/curriculum.ports";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { VocabularyOrmEntity } from "./vocabulary.orm-entity";

@Injectable()
export class VocabularyRepositoryAdapter implements VocabularyRepositoryPort {
  constructor(
    @InjectRepository(VocabularyOrmEntity)
    private readonly repository: Repository<VocabularyOrmEntity>,
  ) {}

  async findByIds(ids: string[]): Promise<Vocabulary[]> {
    if (ids.length === 0) return [];
    const entities = await this.repository.find({
      where: { id: In(ids) },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: VocabularyOrmEntity): Vocabulary {
    return {
      id: entity.id,
      hanzi: entity.hanzi,
      pinyin: entity.pinyin,
      meaningVi: entity.meaningVi,
      audioUrl: entity.audioUrl,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
