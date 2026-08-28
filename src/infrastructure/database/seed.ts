/* Seed raw query rows are narrowed by their fixed RETURNING/select shape. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import "reflect-metadata";
import { DataSource, EntityManager } from "typeorm";
import dataSource from "./typeorm.data-source";
import { ContentStatus } from "../../modules/curriculum/domain/level.entity";
import { LevelOrmEntity } from "../../modules/curriculum/infrastructure/persistence/level.orm-entity";
import { UnitOrmEntity } from "../../modules/curriculum/infrastructure/persistence/unit.orm-entity";
import { LessonOrmEntity } from "../../modules/curriculum/infrastructure/persistence/lesson.orm-entity";
import { VocabularyOrmEntity } from "../../modules/curriculum/infrastructure/persistence/vocabulary.orm-entity";
import { LessonVocabularyOrmEntity } from "../../modules/curriculum/infrastructure/persistence/lesson-vocabulary.orm-entity";
import { ExampleSentenceOrmEntity } from "../../modules/curriculum/infrastructure/persistence/example-sentence.orm-entity";
import { GrammarPointOrmEntity } from "../../modules/curriculum/infrastructure/persistence/grammar-point.orm-entity";

const LEVEL_SLUG = "starter-chinese";
const UNIT_SLUG = "greetings";
const LESSON_SLUG = "say-hello";

async function seedDemoCurriculum(manager: EntityManager): Promise<void> {
  const levels = manager.getRepository(LevelOrmEntity);
  const units = manager.getRepository(UnitOrmEntity);
  const lessons = manager.getRepository(LessonOrmEntity);
  const vocabulary = manager.getRepository(VocabularyOrmEntity);
  const lessonVocabulary = manager.getRepository(LessonVocabularyOrmEntity);
  const examples = manager.getRepository(ExampleSentenceOrmEntity);
  const grammarPoints = manager.getRepository(GrammarPointOrmEntity);

  let level = await levels.findOneBy({ slug: LEVEL_SLUG });
  if (!level) {
    level = await levels.save(
      levels.create({
        slug: LEVEL_SLUG,
        title: "Tiếng Trung nhập môn",
        description: "Những câu chào hỏi đầu tiên bằng tiếng Trung.",
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      }),
    );
  }

  let unit = await units.findOneBy({ levelId: level.id, slug: UNIT_SLUG });
  if (!unit) {
    unit = await units.save(
      units.create({
        levelId: level.id,
        slug: UNIT_SLUG,
        title: "Chào hỏi",
        description: "Làm quen với lời chào cơ bản.",
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      }),
    );
  }

  let lesson = await lessons.findOneBy({ unitId: unit.id, slug: LESSON_SLUG });
  if (!lesson) {
    lesson = await lessons.save(
      lessons.create({
        unitId: unit.id,
        slug: LESSON_SLUG,
        title: "Nói lời chào",
        summary: "Học cách nói xin chào và cảm ơn.",
        writingCharacter: "你",
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      }),
    );
  }

  const seedVocabulary = [
    {
      hanzi: "你好",
      pinyin: "nǐ hǎo",
      meaningVi: "xin chào",
      exampleHanzi: "你好，我叫安。",
      examplePinyin: "Nǐ hǎo, wǒ jiào An.",
      exampleMeaningVi: "Xin chào, tôi tên là An.",
    },
    {
      hanzi: "谢谢",
      pinyin: "xièxie",
      meaningVi: "cảm ơn",
      exampleHanzi: "谢谢你！",
      examplePinyin: "Xièxie nǐ!",
      exampleMeaningVi: "Cảm ơn bạn!",
    },
  ];

  for (const [sortOrder, item] of seedVocabulary.entries()) {
    let word = await vocabulary.findOneBy({
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.meaningVi,
    });
    if (!word) {
      word = await vocabulary.save(
        vocabulary.create({
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          meaningVi: item.meaningVi,
          audioUrl: null,
          status: ContentStatus.PUBLISHED,
        }),
      );
    }

    const placement = await lessonVocabulary.findOneBy({
      lessonId: lesson.id,
      vocabularyId: word.id,
    });
    if (!placement) {
      await lessonVocabulary.save(
        lessonVocabulary.create({
          lessonId: lesson.id,
          vocabularyId: word.id,
          sortOrder: sortOrder + 1,
        }),
      );
    }

    const existingExample = await examples.findOneBy({
      vocabularyId: word.id,
      sortOrder: 1,
    });
    if (!existingExample) {
      await examples.save(
        examples.create({
          vocabularyId: word.id,
          hanzi: item.exampleHanzi,
          pinyin: item.examplePinyin,
          meaningVi: item.exampleMeaningVi,
          audioUrl: null,
          sortOrder: 1,
        }),
      );
    }
  }

  const grammar = await grammarPoints.findOneBy({
    lessonId: lesson.id,
    sortOrder: 1,
  });
  if (!grammar) {
    await grammarPoints.save(
      grammarPoints.create({
        lessonId: lesson.id,
        title: "Đại từ nhân xưng 你",
        explanationVi: "你 (nǐ) nghĩa là bạn; dùng trước lời chào 你好.",
        examplesJson: ["你好吗？", "你好！"],
        sortOrder: 1,
      }),
    );
  }

  const [existingQuiz] = await manager.query(
    `SELECT "id" FROM "quizzes" WHERE "lessonId" = $1 AND "title" = $2 LIMIT 1`,
    [lesson.id, "Ôn tập: Nói lời chào"],
  );
  const quiz =
    existingQuiz ??
    (
      await manager.query(
        `INSERT INTO "quizzes" ("lessonId", "title", "kind", "passingScore", "status")
         VALUES ($1, $2, 'lesson', 70, 'published') RETURNING "id"`,
        [lesson.id, "Ôn tập: Nói lời chào"],
      )
    )[0];

  const quizQuestions = [
    {
      type: "hanzi_to_meaning",
      prompt: "你好 nghĩa là gì?",
      options: [
        ["xin chào", true],
        ["cảm ơn", false],
        ["tạm biệt", false],
        ["xin lỗi", false],
      ],
    },
    {
      type: "meaning_to_hanzi",
      prompt: "Chọn chữ Hán cho nghĩa: cảm ơn.",
      options: [
        ["你好", false],
        ["谢谢", true],
        ["再见", false],
        ["请", false],
      ],
    },
  ] as const;

  for (const [questionIndex, item] of quizQuestions.entries()) {
    const [existingQuestion] = await manager.query(
      `SELECT "id" FROM "quiz_questions" WHERE "quizId" = $1 AND "sortOrder" = $2`,
      [quiz.id, questionIndex + 1],
    );
    const question =
      existingQuestion ??
      (
        await manager.query(
          `INSERT INTO "quiz_questions" ("quizId", "type", "prompt", "sortOrder")
           VALUES ($1, $2, $3, $4) RETURNING "id"`,
          [quiz.id, item.type, item.prompt, questionIndex + 1],
        )
      )[0];
    for (const [optionIndex, [label, isCorrect]] of item.options.entries()) {
      const [existingOption] = await manager.query(
        `SELECT "id" FROM "quiz_options" WHERE "questionId" = $1 AND "sortOrder" = $2`,
        [question.id, optionIndex + 1],
      );
      if (!existingOption) {
        await manager.query(
          `INSERT INTO "quiz_options" ("questionId", "label", "isCorrect", "sortOrder")
           VALUES ($1, $2, $3, $4)`,
          [question.id, label, isCorrect, optionIndex + 1],
        );
      }
    }
  }
}

async function runSeed(source: DataSource): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The demo seed is disabled in production.");
  }

  await source.initialize();
  await source.transaction(seedDemoCurriculum);
  await source.destroy();
}

void runSeed(dataSource).catch((error: unknown) => {
  console.error("Demo seed failed.", error);
  process.exitCode = 1;
});
