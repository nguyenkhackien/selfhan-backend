import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRepositoryPort } from "../../application/auth.ports";
import { CreateUserInput, User } from "../../domain/user.entity";
import { UserOrmEntity } from "./user.orm-entity";

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const entity = this.repository.create({
      email: input.email,
      passwordHash: input.password,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: UserOrmEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      createdAt: entity.createdAt,
    };
  }
}
