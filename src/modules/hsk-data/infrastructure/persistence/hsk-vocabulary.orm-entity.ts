import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { HskVocabularySenseOrmEntity } from "./hsk-vocabulary-sense.orm-entity";

export enum HskVocabularyImportStatus {
  READY = "ready",
  NEEDS_REVIEW = "needs_review",
}

@Entity("hsk_vocabulary")
@Index("UQ_hsk_vocabulary_band_simplified", ["hskBand", "simplified"], {
  unique: true,
})
@Index("UQ_hsk_vocabulary_band_source_order", ["hskBand", "sourceOrder"], {
  unique: true,
})
export class HskVocabularyOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "smallint" })
  hskBand!: number;

  @Column({ type: "int" })
  sourceOrder!: number;

  @Column({ type: "varchar", length: 100 })
  simplified!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  traditional!: string | null;

  @Column({ type: "varchar", length: 255 })
  pinyin!: string;

  @Column({ type: "int", nullable: true })
  frequency!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  sinoViet!: string | null;

  @Column({
    type: "enum",
    enum: HskVocabularyImportStatus,
    enumName: "hsk_import_status_enum",
  })
  importStatus!: HskVocabularyImportStatus;

  @Column({ type: "varchar", length: 64 })
  sourceRevision!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => HskVocabularySenseOrmEntity, (sense) => sense.vocabulary)
  senses!: HskVocabularySenseOrmEntity[];
}
