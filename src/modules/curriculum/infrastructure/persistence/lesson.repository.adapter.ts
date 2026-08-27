import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonRepositoryPort } from "../../application/curriculum.ports";
import { ContentStatus } from "../../domain/level.entity";
import { Lesson } from "../../domain/lesson.entity";
import { LessonOrmEntity } from "./lesson.orm-entity";

@Injectable()
export class LessonRepositoryAdapter implements LessonRepositoryPort {
  constructor(
    @InjectRepository(LessonOrmEntity)
    private readonly repository: Repository<LessonOrmEntity>,
  ) {}

  async findBySlug(slug: string): Promise<Lesson | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.toDomain(entity) : null;
  }

  async findPublishedByUnitId(unitId: string): Promise<Lesson[]> {
    const entities = await this.repository.find({
      where: { unitId, status: ContentStatus.PUBLISHED },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: LessonOrmEntity): Lesson {
    return {
      id: entity.id,
      unitId: entity.unitId,
      title: entity.title,
      slug: entity.slug,
      summary: entity.summary,
      writingCharacter: entity.writingCharacter,
      sortOrder: entity.sortOrder,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
