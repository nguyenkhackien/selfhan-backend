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
import { VocabularyOrmEntity } from "./vocabulary.orm-entity";

@Entity("example_sentences")
@Unique("UQ_example_sentence_vocab_sort", ["vocabularyId", "sortOrder"])
export class ExampleSentenceOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  vocabularyId!: string;

  @ManyToOne(() => VocabularyOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vocabularyId" })
  vocabulary!: VocabularyOrmEntity;

  @Column({ type: "varchar", length: 500 })
  hanzi!: string;

  @Column({ type: "varchar", length: 500 })
  pinyin!: string;

  @Column({ type: "varchar", length: 500 })
  meaningVi!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  audioUrl!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
