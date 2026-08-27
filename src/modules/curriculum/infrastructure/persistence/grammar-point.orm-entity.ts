import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { LessonOrmEntity } from "./lesson.orm-entity";

@Entity("grammar_points")
@Unique("UQ_grammar_point_lesson_sort", ["lessonId", "sortOrder"])
export class GrammarPointOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  lessonId!: string;

  @ManyToOne(() => LessonOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lessonId" })
  lesson!: LessonOrmEntity;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  explanationVi!: string;

  @Column({ type: "jsonb", default: "[]" })
  examplesJson!: string[];

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
