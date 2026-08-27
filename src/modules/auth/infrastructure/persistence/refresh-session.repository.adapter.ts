import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { RefreshSessionRepositoryPort } from "../../application/auth.ports";
import {
  CreateRefreshSessionInput,
  RefreshSession,
} from "../../domain/refresh-session.entity";
import { RefreshSessionOrmEntity } from "./refresh-session.orm-entity";

@Injectable()
export class RefreshSessionRepositoryAdapter implements RefreshSessionRepositoryPort {
  constructor(
    @InjectRepository(RefreshSessionOrmEntity)
    private readonly repository: Repository<RefreshSessionOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(input: CreateRefreshSessionInput): Promise<RefreshSession> {
    const entity = this.repository.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const entity = await this.repository.findOne({
      where: { tokenHash },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async rotate(
    currentSessionId: string,
    input: CreateRefreshSessionInput,
  ): Promise<RefreshSession | null> {
    return this.dataSource.transaction(async (manager) => {
      const sessions = manager.getRepository(RefreshSessionOrmEntity);
      const revoked = await sessions.update(
        { id: currentSessionId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      if (revoked.affected !== 1) {
        return null;
      }

      const created = sessions.create({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
      return this.toDomain(await sessions.save(created));
    });
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private toDomain(entity: RefreshSessionOrmEntity): RefreshSession {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    };
  }
}
