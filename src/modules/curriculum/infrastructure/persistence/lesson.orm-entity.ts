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
import { UnitOrmEntity } from "./unit.orm-entity";

@Entity("lessons")
@Index("UQ_lesson_slug", ["slug"], {
  unique: true,
  where: "status != 'archived'",
})
@Index("UQ_lesson_unit_sort", ["unitId", "sortOrder"], {
  unique: true,
  where: "status != 'archived'",
})
export class LessonOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  unitId!: string;

  @ManyToOne(() => UnitOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "unitId" })
  unit!: UnitOrmEntity;

  @Column({ type: "varchar", length: 100 })
  slug!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @Column({ type: "varchar", length: 1, nullable: true })
  writingCharacter!: string | null;

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
