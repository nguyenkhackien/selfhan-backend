import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLearningAndQuizSchema1724200000000 implements MigrationInterface {
  name = "CreateLearningAndQuizSchema1724200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "quiz_kind_enum" AS ENUM ('lesson', 'unit');
      CREATE TYPE "quiz_question_type_enum" AS ENUM ('hanzi_to_meaning', 'meaning_to_hanzi', 'pinyin', 'listening');
      CREATE TYPE "lesson_progress_status_enum" AS ENUM ('not_started', 'in_progress', 'completed');
      CREATE TYPE "review_rating_enum" AS ENUM ('again', 'hard', 'good', 'easy');
      CREATE TYPE "vocabulary_tag_enum" AS ENUM ('favorite', 'difficult');
    `);

    await queryRunner.query(`
      CREATE TABLE "quizzes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "lessonId" UUID,
        "unitId" UUID,
        "title" VARCHAR(255) NOT NULL,
        "kind" "quiz_kind_enum" NOT NULL,
        "passingScore" INTEGER NOT NULL DEFAULT 70,
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_quizzes_lesson" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quizzes_unit" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_quizzes_target" CHECK (("lessonId" IS NULL) <> ("unitId" IS NULL)),
        CONSTRAINT "CHK_quizzes_kind_target" CHECK (("kind" = 'lesson' AND "lessonId" IS NOT NULL) OR ("kind" = 'unit' AND "unitId" IS NOT NULL)),
        CONSTRAINT "CHK_quizzes_passing_score" CHECK ("passingScore" BETWEEN 0 AND 100)
      );
      CREATE INDEX "IDX_quizzes_lessonId" ON "quizzes" ("lessonId");
      CREATE INDEX "IDX_quizzes_unitId" ON "quizzes" ("unitId");
    `);

    await queryRunner.query(`
      CREATE TABLE "quiz_questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "quizId" UUID NOT NULL,
        "type" "quiz_question_type_enum" NOT NULL,
        "prompt" TEXT NOT NULL,
        "audioUrl" VARCHAR(512),
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_quiz_questions_quiz" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_quiz_question_order" UNIQUE ("quizId", "sortOrder")
      );
      CREATE INDEX "IDX_quiz_questions_quizId" ON "quiz_questions" ("quizId");

      CREATE TABLE "quiz_options" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "questionId" UUID NOT NULL,
        "label" VARCHAR(500) NOT NULL,
        "isCorrect" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "FK_quiz_options_question" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_quiz_option_order" UNIQUE ("questionId", "sortOrder")
      );
      CREATE INDEX "IDX_quiz_options_questionId" ON "quiz_options" ("questionId");
    `);

    await queryRunner.query(`
      CREATE TABLE "quiz_attempts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "quizId" UUID NOT NULL,
        "score" INTEGER NOT NULL,
        "questionCount" INTEGER NOT NULL,
        "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_quiz_attempts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_attempts_quiz" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_quiz_attempt_score" CHECK ("score" BETWEEN 0 AND 100),
        CONSTRAINT "CHK_quiz_attempt_question_count" CHECK ("questionCount" > 0)
      );
      CREATE INDEX "IDX_quiz_attempts_user_quiz" ON "quiz_attempts" ("userId", "quizId", "submittedAt" DESC);

      CREATE TABLE "quiz_answers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "attemptId" UUID NOT NULL,
        "questionId" UUID NOT NULL,
        "selectedOptionId" UUID NOT NULL,
        "isCorrect" BOOLEAN NOT NULL,
        "answeredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_quiz_answers_attempt" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_answers_question" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_quiz_answers_option" FOREIGN KEY ("selectedOptionId") REFERENCES "quiz_options"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_quiz_answer_attempt_question" UNIQUE ("attemptId", "questionId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "lesson_progress" (
        "userId" UUID NOT NULL,
        "lessonId" UUID NOT NULL,
        "sectionsSeen" JSONB NOT NULL DEFAULT '[]',
        "status" "lesson_progress_status_enum" NOT NULL DEFAULT 'not_started',
        "firstCompletedAt" TIMESTAMPTZ,
        "lastActivityAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY ("userId", "lessonId"),
        CONSTRAINT "FK_lesson_progress_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lesson_progress_lesson" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_lesson_progress_user_status" ON "lesson_progress" ("userId", "status");

      CREATE TABLE "learning_activities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "activityDate" DATE NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "sourceId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_learning_activities_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_learning_activity_daily_source" UNIQUE ("userId", "activityDate", "type", "sourceId")
      );
      CREATE INDEX "IDX_learning_activities_user_date" ON "learning_activities" ("userId", "activityDate" DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE "vocabulary_reviews" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "vocabularyId" UUID NOT NULL,
        "rating" "review_rating_enum" NOT NULL,
        "reviewedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "nextReviewAt" TIMESTAMPTZ NOT NULL,
        "srsStage" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "FK_vocabulary_reviews_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_vocabulary_reviews_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_vocabulary_review_user_vocabulary" UNIQUE ("userId", "vocabularyId"),
        CONSTRAINT "CHK_vocabulary_review_stage" CHECK ("srsStage" BETWEEN 0 AND 5)
      );
      CREATE INDEX "IDX_vocabulary_reviews_due" ON "vocabulary_reviews" ("userId", "nextReviewAt");

      CREATE TABLE "user_vocabulary_tags" (
        "userId" UUID NOT NULL,
        "vocabularyId" UUID NOT NULL,
        "tag" "vocabulary_tag_enum" NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY ("userId", "vocabularyId", "tag"),
        CONSTRAINT "FK_user_vocabulary_tags_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_vocabulary_tags_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_vocabulary_tags"`);
    await queryRunner.query(`DROP TABLE "vocabulary_reviews"`);
    await queryRunner.query(`DROP TABLE "learning_activities"`);
    await queryRunner.query(`DROP TABLE "lesson_progress"`);
    await queryRunner.query(`DROP TABLE "quiz_answers"`);
    await queryRunner.query(`DROP TABLE "quiz_attempts"`);
    await queryRunner.query(`DROP TABLE "quiz_options"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP TYPE "vocabulary_tag_enum"`);
    await queryRunner.query(`DROP TYPE "review_rating_enum"`);
    await queryRunner.query(`DROP TYPE "lesson_progress_status_enum"`);
    await queryRunner.query(`DROP TYPE "quiz_question_type_enum"`);
    await queryRunner.query(`DROP TYPE "quiz_kind_enum"`);
  }
}
