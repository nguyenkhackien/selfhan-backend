import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export enum HskCharacterReadingSource {
  KAI_HANZI = "kai_hanzi",
  UNIHAN = "unihan",
}

@Entity("hsk_character_readings")
export class HskCharacterReadingOrmEntity {
  @PrimaryColumn({ type: "varchar", length: 1 })
  hanzi!: string;

  @Column({ type: "varchar", length: 100 })
  sinoViet!: string;

  @Column({
    type: "enum",
    enum: HskCharacterReadingSource,
    enumName: "hsk_character_reading_source_enum",
  })
  source!: HskCharacterReadingSource;

  @Column({ type: "varchar", length: 64 })
  sourceRevision!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
