import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserOrmEntity } from "./user.orm-entity";

@Entity("refresh_sessions")
export class RefreshSessionOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  tokenHash!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
