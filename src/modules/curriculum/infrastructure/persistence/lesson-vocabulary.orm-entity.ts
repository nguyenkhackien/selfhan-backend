import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { LessonOrmEntity } from "./lesson.orm-entity";
import { VocabularyOrmEntity } from "./vocabulary.orm-entity";

@Entity("lesson_vocabulary")
@Unique("UQ_lesson_vocab_lesson_vocabulary", ["lessonId", "vocabularyId"])
@Unique("UQ_lesson_vocab_lesson_sort", ["lessonId", "sortOrder"])
export class LessonVocabularyOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  lessonId!: string;

  @ManyToOne(() => LessonOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lessonId" })
  lesson!: LessonOrmEntity;

  @Index()
  @Column({ type: "uuid" })
  vocabularyId!: string;

  @ManyToOne(() => VocabularyOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vocabularyId" })
  vocabulary!: VocabularyOrmEntity;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;
}
