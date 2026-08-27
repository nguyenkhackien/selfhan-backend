import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { ContentStatus } from "../../domain/level.entity";

@Entity("levels")
export class LevelOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100 })
  slug!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({
    type: "enum",
    enum: ContentStatus,
    enumName: "content_status_enum",
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
