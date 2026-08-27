import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthAndCurriculumSchema1724000000000 implements MigrationInterface {
  name = "CreateAuthAndCurriculumSchema1724000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('learner', 'admin');
      CREATE TYPE "content_status_enum" AS ENUM ('draft', 'published', 'archived');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'learner',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX "IDX_users_email" ON "users" (LOWER("email"));
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "tokenHash" VARCHAR(255) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "revokedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "FK_refresh_sessions_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_refresh_sessions_userId" ON "refresh_sessions" ("userId");
      CREATE UNIQUE INDEX "IDX_refresh_sessions_tokenHash" ON "refresh_sessions" ("tokenHash");
    `);

    await queryRunner.query(`
      CREATE TABLE "levels" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" VARCHAR(100) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX "IDX_levels_slug" ON "levels" ("slug");
    `);

    await queryRunner.query(`
      CREATE TABLE "units" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "levelId" UUID NOT NULL,
        "slug" VARCHAR(100) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "FK_units_level"
          FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_units_levelId" ON "units" ("levelId");
      CREATE UNIQUE INDEX "UQ_unit_slug" ON "units" ("slug") WHERE "status" != 'archived';
      CREATE UNIQUE INDEX "UQ_unit_level_sort" ON "units" ("levelId", "sortOrder") WHERE "status" != 'archived';
    `);

    await queryRunner.query(`
      CREATE TABLE "lessons" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "unitId" UUID NOT NULL,
        "slug" VARCHAR(100) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "summary" TEXT,
        "writingCharacter" VARCHAR(1),
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "FK_lessons_unit"
          FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_lessons_unitId" ON "lessons" ("unitId");
      CREATE UNIQUE INDEX "UQ_lesson_slug" ON "lessons" ("slug") WHERE "status" != 'archived';
      CREATE UNIQUE INDEX "UQ_lesson_unit_sort" ON "lessons" ("unitId", "sortOrder") WHERE "status" != 'archived';
    `);

    await queryRunner.query(`
      CREATE TABLE "vocabulary" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "hanzi" VARCHAR(10) NOT NULL,
        "pinyin" VARCHAR(255) NOT NULL,
        "meaningVi" VARCHAR(255) NOT NULL,
        "audioUrl" VARCHAR(512),
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "lesson_vocabulary" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lessonId" UUID NOT NULL,
        "vocabularyId" UUID NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,

        CONSTRAINT "FK_lesson_vocabulary_lesson"
          FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lesson_vocabulary_vocabulary"
          FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_lesson_vocabulary_lessonId" ON "lesson_vocabulary" ("lessonId");
      CREATE INDEX "IDX_lesson_vocabulary_vocabularyId" ON "lesson_vocabulary" ("vocabularyId");
      CREATE UNIQUE INDEX "UQ_lesson_vocab_lesson_vocabulary" ON "lesson_vocabulary" ("lessonId", "vocabularyId");
      CREATE UNIQUE INDEX "UQ_lesson_vocab_lesson_sort" ON "lesson_vocabulary" ("lessonId", "sortOrder");
    `);

    await queryRunner.query(`
      CREATE TABLE "example_sentences" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "vocabularyId" UUID NOT NULL,
        "hanzi" VARCHAR(500) NOT NULL,
        "pinyin" VARCHAR(500) NOT NULL,
        "meaningVi" VARCHAR(500) NOT NULL,
        "audioUrl" VARCHAR(512),
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "FK_example_sentences_vocabulary"
          FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_example_sentences_vocabularyId" ON "example_sentences" ("vocabularyId");
      CREATE UNIQUE INDEX "UQ_example_sentence_vocab_sort" ON "example_sentences" ("vocabularyId", "sortOrder");
    `);

    await queryRunner.query(`
      CREATE TABLE "grammar_points" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lessonId" UUID NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "explanationVi" TEXT NOT NULL,
        "examplesJson" JSONB NOT NULL DEFAULT '[]',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "FK_grammar_points_lesson"
          FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_grammar_points_lessonId" ON "grammar_points" ("lessonId");
      CREATE UNIQUE INDEX "UQ_grammar_point_lesson_sort" ON "grammar_points" ("lessonId", "sortOrder");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "grammar_points"`);
    await queryRunner.query(`DROP TABLE "example_sentences"`);
    await queryRunner.query(`DROP TABLE "lesson_vocabulary"`);
    await queryRunner.query(`DROP TABLE "vocabulary"`);
    await queryRunner.query(`DROP TABLE "lessons"`);
    await queryRunner.query(`DROP TABLE "units"`);
    await queryRunner.query(`DROP TABLE "levels"`);
    await queryRunner.query(`DROP TABLE "refresh_sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "content_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
