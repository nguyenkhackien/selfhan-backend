import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnitRepositoryPort } from "../../application/curriculum.ports";
import { ContentStatus } from "../../domain/level.entity";
import { Unit } from "../../domain/unit.entity";
import { UnitOrmEntity } from "./unit.orm-entity";

@Injectable()
export class UnitRepositoryAdapter implements UnitRepositoryPort {
  constructor(
    @InjectRepository(UnitOrmEntity)
    private readonly repository: Repository<UnitOrmEntity>,
  ) {}

  async findBySlug(slug: string): Promise<Unit | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Unit | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findPublishedByLevelId(levelId: string): Promise<Unit[]> {
    const entities = await this.repository.find({
      where: { levelId, status: ContentStatus.PUBLISHED },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: UnitOrmEntity): Unit {
    return {
      id: entity.id,
      levelId: entity.levelId,
      title: entity.title,
      slug: entity.slug,
      description: entity.description,
      sortOrder: entity.sortOrder,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
