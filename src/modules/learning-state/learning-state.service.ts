/* TypeORM exposes raw SQL rows as `any`; this module owns their validation boundary. */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";

const REQUIRED_SECTIONS = ["vocabulary", "grammar", "writing"];
const SRS_DAYS = [1, 3, 7, 14, 30];

type QuizRow = {
  id: string;
  lessonId: string | null;
  unitId: string | null;
  passingScore: number;
};
type QuestionRow = {
  id: string;
  prompt: string;
  type: string;
  audioUrl: string | null;
  sortOrder: number;
};
type OptionRow = {
  id: string;
  questionId: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
};

@Injectable()
export class LearningStateService {
  constructor(private readonly dataSource: DataSource) {}

  async listQuizzes(target: "lesson" | "unit", id: string) {
    const rows = await this.dataSource.query(
      `SELECT "id", "title", "kind", "passingScore" FROM "quizzes"
       WHERE "${target}Id" = $1 AND "status" = 'published' ORDER BY "createdAt" ASC`,
      [id],
    );
    return rows;
  }

  async getQuiz(quizId: string) {
    const quiz = await this.findPublishedQuiz(this.dataSource.manager, quizId);
    const questions = (await this.dataSource.query(
      `SELECT "id", "prompt", "type", "audioUrl", "sortOrder" FROM "quiz_questions"
       WHERE "quizId" = $1 ORDER BY "sortOrder" ASC`,
      [quiz.id],
    )) as QuestionRow[];
    const options = (await this.dataSource.query(
      `SELECT "id", "questionId", "label", "sortOrder" FROM "quiz_options"
       WHERE "questionId" = ANY($1::uuid[]) ORDER BY "sortOrder" ASC`,
      [questions.map((question) => question.id)],
    )) as Array<Omit<OptionRow, "isCorrect">>;
    return {
      id: quiz.id,
      lessonId: quiz.lessonId,
      unitId: quiz.unitId,
      passingScore: quiz.passingScore,
      questions: questions.map((question) => ({
        ...question,
        options: options.filter((option) => option.questionId === question.id),
      })),
    };
  }

  async submitAttempt(
    userId: string,
    quizId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const quiz = await this.findPublishedQuiz(manager, quizId);
      const questions = (await manager.query(
        `SELECT "id", "prompt", "type", "audioUrl", "sortOrder" FROM "quiz_questions"
         WHERE "quizId" = $1 ORDER BY "sortOrder" ASC`,
        [quiz.id],
      )) as QuestionRow[];
      if (questions.length === 0 || answers.length !== questions.length) {
        throw new BadRequestException(
          "Every quiz question must have one answer.",
        );
      }
      const answerByQuestion = new Map(
        answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
      );
      if (
        answerByQuestion.size !== questions.length ||
        questions.some((question) => !answerByQuestion.has(question.id))
      ) {
        throw new BadRequestException("Quiz answers do not match this quiz.");
      }
      const options = (await manager.query(
        `SELECT "id", "questionId", "label", "isCorrect", "sortOrder" FROM "quiz_options"
         WHERE "questionId" = ANY($1::uuid[])`,
        [questions.map((question) => question.id)],
      )) as OptionRow[];
      const scored = questions.map((question) => {
        const selectedOptionId = answerByQuestion.get(question.id)!;
        const option = options.find(
          (item) =>
            item.id === selectedOptionId && item.questionId === question.id,
        );
        if (!option)
          throw new BadRequestException(
            "Selected option does not belong to this quiz.",
          );
        return {
          questionId: question.id,
          selectedOptionId,
          isCorrect: option.isCorrect,
        };
      });
      const correctCount = scored.filter((answer) => answer.isCorrect).length;
      const score = Math.round((correctCount / questions.length) * 100);
      const [attempt] = await manager.query(
        `INSERT INTO "quiz_attempts" ("userId", "quizId", "score", "questionCount")
         VALUES ($1, $2, $3, $4) RETURNING "id", "score", "questionCount", "submittedAt"`,
        [userId, quiz.id, score, questions.length],
      );
      for (const answer of scored) {
        await manager.query(
          `INSERT INTO "quiz_answers" ("attemptId", "questionId", "selectedOptionId", "isCorrect")
           VALUES ($1, $2, $3, $4)`,
          [
            attempt.id,
            answer.questionId,
            answer.selectedOptionId,
            answer.isCorrect,
          ],
        );
      }
      if (quiz.lessonId)
        await this.maybeCompleteLesson(
          manager,
          userId,
          quiz.lessonId,
          score,
          quiz.passingScore,
        );
      return { ...attempt, answers: scored };
    });
  }

  async updateProgress(
    userId: string,
    lessonId: string,
    sectionsSeen: string[],
  ) {
    const sections = [...new Set(sectionsSeen)].filter((section) =>
      REQUIRED_SECTIONS.includes(section),
    );
    if (sections.length !== sectionsSeen.length)
      throw new BadRequestException("Unknown lesson section.");
    return this.dataSource.transaction(async (manager) => {
      await this.requireLesson(manager, lessonId);
      await manager.query(
        `INSERT INTO "lesson_progress" ("userId", "lessonId", "sectionsSeen", "status", "lastActivityAt")
         VALUES ($1, $2, $3::jsonb, 'in_progress', now())
         ON CONFLICT ("userId", "lessonId") DO UPDATE SET
           "sectionsSeen" = EXCLUDED."sectionsSeen", "lastActivityAt" = now(),
           "status" = CASE WHEN "lesson_progress"."status" = 'completed' THEN 'completed' ELSE 'in_progress' END`,
        [userId, lessonId, JSON.stringify(sections)],
      );
      const [latest] = await manager.query(
        `SELECT qa."score", q."passingScore" FROM "quiz_attempts" qa
         JOIN "quizzes" q ON q."id" = qa."quizId"
         WHERE qa."userId" = $1 AND q."lessonId" = $2 ORDER BY qa."submittedAt" DESC LIMIT 1`,
        [userId, lessonId],
      );
      await this.maybeCompleteLesson(
        manager,
        userId,
        lessonId,
        latest?.score ?? 0,
        latest?.passingScore ?? 101,
      );
      return this.getProgress(manager, userId, lessonId);
    });
  }

  async getLessonProgress(userId: string, lessonId: string) {
    await this.requireLesson(this.dataSource.manager, lessonId);
    return (
      (await this.getProgress(this.dataSource.manager, userId, lessonId)) ?? {
        sectionsSeen: [],
        status: "not_started",
        firstCompletedAt: null,
        lastActivityAt: null,
      }
    );
  }

  async dashboard(userId: string) {
    const [summary] = await this.dataSource.query(
      `SELECT
        (SELECT COUNT(*)::int FROM "lesson_progress" WHERE "userId" = $1 AND "status" = 'completed') AS "completedLessons",
        (SELECT COUNT(DISTINCT lv."vocabularyId")::int FROM "lesson_progress" lp JOIN "lesson_vocabulary" lv ON lv."lessonId" = lp."lessonId" WHERE lp."userId" = $1 AND lp."status" = 'completed') AS "learnedWords",
        (SELECT COUNT(*)::int FROM "vocabulary_reviews" WHERE "userId" = $1 AND "nextReviewAt" <= now()) AS "dueReviewCount",
        (SELECT COALESCE(ROUND(AVG("score")), 0)::int FROM "quiz_attempts" WHERE "userId" = $1) AS "accuracy"`,
      [userId],
    );
    const [continuation] = await this.dataSource.query(
      `SELECT l."id", l."slug", l."title" FROM "lesson_progress" lp JOIN "lessons" l ON l."id" = lp."lessonId"
       WHERE lp."userId" = $1 AND lp."status" != 'completed' ORDER BY lp."lastActivityAt" DESC LIMIT 1`,
      [userId],
    );
    return {
      ...summary,
      currentStreak: await this.currentStreak(userId),
      continueLesson: continuation ?? null,
    };
  }

  async dueReviews(userId: string, limit = 20, cursor?: string) {
    const cursorValues = cursor ? this.decodeReviewCursor(cursor) : null;
    const rows = await this.dataSource.query(
      `SELECT vr."vocabularyId", vr."nextReviewAt", vr."srsStage", v."hanzi", v."pinyin", v."meaningVi"
       FROM "vocabulary_reviews" vr JOIN "vocabulary" v ON v."id" = vr."vocabularyId"
       WHERE vr."userId" = $1 AND vr."nextReviewAt" <= now()
       ${cursorValues ? `AND (vr."nextReviewAt", vr."vocabularyId") > ($2::timestamptz, $3::uuid)` : ""}
       ORDER BY vr."nextReviewAt" ASC, vr."vocabularyId" ASC LIMIT $${cursorValues ? 4 : 2}`,
      cursorValues
        ? [
            userId,
            cursorValues.nextReviewAt,
            cursorValues.vocabularyId,
            limit + 1,
          ]
        : [userId, limit + 1],
    );
    const items = rows.slice(0, limit);
    const last = items[items.length - 1] as
      { nextReviewAt: string; vocabularyId: string } | undefined;
    return {
      items,
      nextCursor:
        rows.length > limit && last ? this.encodeReviewCursor(last) : null,
    };
  }

  async review(
    userId: string,
    vocabularyId: string,
    rating: "again" | "hard" | "good" | "easy",
  ) {
    await this.requireVocabulary(this.dataSource.manager, vocabularyId);
    const [current] = await this.dataSource.query(
      `SELECT "srsStage" FROM "vocabulary_reviews" WHERE "userId" = $1 AND "vocabularyId" = $2`,
      [userId, vocabularyId],
    );
    const previousStage = current?.srsStage ?? 0;
    const nextStage =
      rating === "again"
        ? 0
        : rating === "easy"
          ? Math.min(previousStage + 2, 5)
          : Math.min(previousStage + 1, 5);
    const days = rating === "again" ? 1 : SRS_DAYS[Math.max(nextStage - 1, 0)]!;
    const [result] = await this.dataSource.query(
      `INSERT INTO "vocabulary_reviews" ("userId", "vocabularyId", "rating", "reviewedAt", "nextReviewAt", "srsStage")
       VALUES ($1, $2, $3, now(), now() + ($4 * INTERVAL '1 day'), $5)
       ON CONFLICT ("userId", "vocabularyId") DO UPDATE SET
         "rating" = EXCLUDED."rating", "reviewedAt" = now(), "nextReviewAt" = EXCLUDED."nextReviewAt", "srsStage" = EXCLUDED."srsStage"
       RETURNING "vocabularyId", "rating", "nextReviewAt", "srsStage"`,
      [userId, vocabularyId, rating, days, nextStage],
    );
    return result;
  }

  async tag(userId: string, vocabularyId: string, tag: string) {
    await this.requireVocabulary(this.dataSource.manager, vocabularyId);
    await this.dataSource.query(
      `INSERT INTO "user_vocabulary_tags" ("userId", "vocabularyId", "tag") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [userId, vocabularyId, tag],
    );
  }

  async untag(userId: string, vocabularyId: string, tag: string) {
    await this.dataSource.query(
      `DELETE FROM "user_vocabulary_tags" WHERE "userId" = $1 AND "vocabularyId" = $2 AND "tag" = $3`,
      [userId, vocabularyId, tag],
    );
  }

  async statistics(userId: string) {
    const [result] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS "attemptCount", COALESCE(SUM("questionCount"), 0)::int AS "questionCount", COALESCE(ROUND(AVG("score")), 0)::int AS "accuracy"
       FROM "quiz_attempts" WHERE "userId" = $1`,
      [userId],
    );
    return result;
  }

  private async findPublishedQuiz(
    manager: EntityManager,
    quizId: string,
  ): Promise<QuizRow> {
    const [quiz] = await manager.query(
      `SELECT "id", "lessonId", "unitId", "passingScore" FROM "quizzes" WHERE "id" = $1 AND "status" = 'published'`,
      [quizId],
    );
    if (!quiz) throw new NotFoundException("Published quiz was not found.");
    return quiz as QuizRow;
  }

  private async requireLesson(
    manager: EntityManager,
    lessonId: string,
  ): Promise<void> {
    const [lesson] = await manager.query(
      `SELECT "id" FROM "lessons" WHERE "id" = $1`,
      [lessonId],
    );
    if (!lesson) throw new NotFoundException("Lesson was not found.");
  }

  private async requireVocabulary(
    manager: EntityManager,
    vocabularyId: string,
  ): Promise<void> {
    const [vocabulary] = await manager.query(
      `SELECT "id" FROM "vocabulary" WHERE "id" = $1`,
      [vocabularyId],
    );
    if (!vocabulary)
      throw new NotFoundException("Vocabulary item was not found.");
  }

  private decodeReviewCursor(cursor: string): {
    nextReviewAt: string;
    vocabularyId: string;
  } {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf8"),
      ) as unknown;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof (parsed as Record<string, unknown>).nextReviewAt !== "string" ||
        typeof (parsed as Record<string, unknown>).vocabularyId !== "string"
      ) {
        throw new Error("invalid cursor");
      }
      return parsed as { nextReviewAt: string; vocabularyId: string };
    } catch {
      throw new BadRequestException("Review cursor is invalid.");
    }
  }

  private encodeReviewCursor(input: {
    nextReviewAt: string;
    vocabularyId: string;
  }): string {
    return Buffer.from(JSON.stringify(input)).toString("base64url");
  }

  private async getProgress(
    manager: EntityManager,
    userId: string,
    lessonId: string,
  ) {
    const [progress] = await manager.query(
      `SELECT "sectionsSeen", "status", "firstCompletedAt", "lastActivityAt" FROM "lesson_progress" WHERE "userId" = $1 AND "lessonId" = $2`,
      [userId, lessonId],
    );
    return progress;
  }

  private async maybeCompleteLesson(
    manager: EntityManager,
    userId: string,
    lessonId: string,
    score: number,
    passingScore: number,
  ) {
    const progress = await this.getProgress(manager, userId, lessonId);
    const sections = (progress?.sectionsSeen ?? []) as string[];
    if (
      sections.length !== REQUIRED_SECTIONS.length ||
      !REQUIRED_SECTIONS.every((section) => sections.includes(section)) ||
      score < passingScore
    )
      return;
    const [updated] = await manager.query(
      `UPDATE "lesson_progress" SET "status" = 'completed', "firstCompletedAt" = COALESCE("firstCompletedAt", now()), "lastActivityAt" = now()
       WHERE "userId" = $1 AND "lessonId" = $2 AND "status" != 'completed' RETURNING "lessonId"`,
      [userId, lessonId],
    );
    if (!updated) return;
    await manager.query(
      `INSERT INTO "learning_activities" ("userId", "activityDate", "type", "sourceId") VALUES ($1, timezone('Asia/Ho_Chi_Minh', now())::date, 'lesson_completed', $2) ON CONFLICT DO NOTHING`,
      [userId, lessonId],
    );
    await manager.query(
      `INSERT INTO "vocabulary_reviews" ("userId", "vocabularyId", "rating", "nextReviewAt", "srsStage")
       SELECT $1, lv."vocabularyId", 'good', now(), 0 FROM "lesson_vocabulary" lv WHERE lv."lessonId" = $2
       ON CONFLICT ("userId", "vocabularyId") DO NOTHING`,
      [userId, lessonId],
    );
  }

  private async currentStreak(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT DISTINCT "activityDate"::text AS day FROM "learning_activities" WHERE "userId" = $1 ORDER BY day DESC`,
      [userId],
    );
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const part = (type: "year" | "month" | "day") =>
      parts.find((item) => item.type === type)!.value;
    let expectedDay = `${part("year")}-${part("month")}-${part("day")}`;
    let count = 0;
    for (const row of rows as Array<{ day: string }>) {
      if (row.day !== expectedDay) break;
      count += 1;
      const previous = new Date(`${expectedDay}T00:00:00.000Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      expectedDay = previous.toISOString().slice(0, 10);
    }
    return count;
  }
}
