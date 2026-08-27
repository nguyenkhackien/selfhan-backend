import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHskVocabularyDataSchema1724100000000 implements MigrationInterface {
  name = "CreateHskVocabularyDataSchema1724100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "hsk_import_status_enum" AS ENUM ('ready', 'needs_review');
      CREATE TYPE "hsk_character_reading_source_enum" AS ENUM ('kai_hanzi', 'unihan');

      CREATE TABLE "hsk_vocabulary" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "hskBand" SMALLINT NOT NULL CHECK ("hskBand" BETWEEN 1 AND 7),
        "sourceOrder" INTEGER NOT NULL CHECK ("sourceOrder" > 0),
        "simplified" VARCHAR(100) NOT NULL,
        "traditional" VARCHAR(100),
        "pinyin" VARCHAR(255) NOT NULL,
        "frequency" INTEGER,
        "sinoViet" VARCHAR(255),
        "importStatus" "hsk_import_status_enum" NOT NULL,
        "sourceRevision" VARCHAR(64) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX "UQ_hsk_vocabulary_band_simplified"
        ON "hsk_vocabulary" ("hskBand", "simplified");
      CREATE UNIQUE INDEX "UQ_hsk_vocabulary_band_source_order"
        ON "hsk_vocabulary" ("hskBand", "sourceOrder");

      CREATE TABLE "hsk_vocabulary_senses" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "hskVocabularyId" UUID NOT NULL,
        "sourceOrder" INTEGER NOT NULL CHECK ("sourceOrder" > 0),
        "meaningVi" TEXT NOT NULL,
        CONSTRAINT "FK_hsk_vocabulary_senses_vocabulary"
          FOREIGN KEY ("hskVocabularyId") REFERENCES "hsk_vocabulary"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_hsk_vocabulary_senses_vocabulary"
        ON "hsk_vocabulary_senses" ("hskVocabularyId");
      CREATE UNIQUE INDEX "UQ_hsk_vocabulary_sense_order"
        ON "hsk_vocabulary_senses" ("hskVocabularyId", "sourceOrder");

      CREATE TABLE "hsk_character_readings" (
        "hanzi" VARCHAR(1) PRIMARY KEY,
        "sinoViet" VARCHAR(100) NOT NULL,
        "source" "hsk_character_reading_source_enum" NOT NULL,
        "sourceRevision" VARCHAR(64) NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hsk_character_readings"`);
    await queryRunner.query(`DROP TABLE "hsk_vocabulary_senses"`);
    await queryRunner.query(`DROP TABLE "hsk_vocabulary"`);
    await queryRunner.query(`DROP TYPE "hsk_character_reading_source_enum"`);
    await queryRunner.query(`DROP TYPE "hsk_import_status_enum"`);
  }
}
