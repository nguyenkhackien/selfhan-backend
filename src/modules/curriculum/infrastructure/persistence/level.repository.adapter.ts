import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LevelRepositoryPort } from "../../application/curriculum.ports";
import { ContentStatus, Level } from "../../domain/level.entity";
import { LevelOrmEntity } from "./level.orm-entity";

@Injectable()
export class LevelRepositoryAdapter implements LevelRepositoryPort {
  constructor(
    @InjectRepository(LevelOrmEntity)
    private readonly repository: Repository<LevelOrmEntity>,
  ) {}

  async findBySlug(slug: string): Promise<Level | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Level | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findPublished(): Promise<Level[]> {
    const entities = await this.repository.find({
      where: { status: ContentStatus.PUBLISHED },
      order: { sortOrder: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: LevelOrmEntity): Level {
    return {
      id: entity.id,
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
