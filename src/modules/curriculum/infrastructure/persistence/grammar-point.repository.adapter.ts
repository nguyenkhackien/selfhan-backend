import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GrammarPointRepositoryPort } from "../../application/curriculum.ports";
import { GrammarPoint } from "../../domain/grammar-point.entity";
import { GrammarPointOrmEntity } from "./grammar-point.orm-entity";

@Injectable()
export class GrammarPointRepositoryAdapter implements GrammarPointRepositoryPort {
  constructor(
    @InjectRepository(GrammarPointOrmEntity)
    private readonly repository: Repository<GrammarPointOrmEntity>,
  ) {}

  async findByLessonId(lessonId: string): Promise<GrammarPoint[]> {
    const entities = await this.repository.find({
      where: { lessonId },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: GrammarPointOrmEntity): GrammarPoint {
    return {
      id: entity.id,
      lessonId: entity.lessonId,
      title: entity.title,
      explanationVi: entity.explanationVi,
      examplesJson: entity.examplesJson,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
