import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ContentStatus } from "../../domain/level.entity";
import { LevelOrmEntity } from "./level.orm-entity";

@Entity("units")
@Index("UQ_unit_slug", ["slug"], {
  unique: true,
  where: "status != 'archived'",
})
@Index("UQ_unit_level_sort", ["levelId", "sortOrder"], {
  unique: true,
  where: "status != 'archived'",
})
export class UnitOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  levelId!: string;

  @ManyToOne(() => LevelOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "levelId" })
  level!: LevelOrmEntity;

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
