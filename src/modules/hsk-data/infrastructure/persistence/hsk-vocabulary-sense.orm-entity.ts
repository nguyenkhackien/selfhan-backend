import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { HskVocabularyOrmEntity } from "./hsk-vocabulary.orm-entity";

@Entity("hsk_vocabulary_senses")
@Index("UQ_hsk_vocabulary_sense_order", ["hskVocabularyId", "sourceOrder"], {
  unique: true,
})
export class HskVocabularySenseOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  hskVocabularyId!: string;

  @Column({ type: "int" })
  sourceOrder!: number;

  @Column({ type: "text" })
  meaningVi!: string;

  @ManyToOne(() => HskVocabularyOrmEntity, (vocabulary) => vocabulary.senses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "hskVocabularyId" })
  vocabulary!: HskVocabularyOrmEntity;
}
