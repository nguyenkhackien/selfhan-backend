import { NotFoundException } from "@nestjs/common";
import {
  LessonRepositoryPort,
  LevelRepositoryPort,
  UnitRepositoryPort,
} from "./curriculum.ports";
import { GetLessonBySlugUseCase } from "./get-lesson-by-slug.use-case";
import { ContentStatus } from "../domain/level.entity";

describe("GetLessonBySlugUseCase", () => {
  const lesson = {
    id: "lesson-1",
    unitId: "unit-1",
    title: "Greeting",
    slug: "greeting",
    summary: null,
    writingCharacter: null,
    sortOrder: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createUseCase(
    levelStatus = ContentStatus.PUBLISHED,
  ): GetLessonBySlugUseCase {
    return new GetLessonBySlugUseCase(
      {
        findById: jest.fn().mockResolvedValue({ status: levelStatus }),
      } as unknown as LevelRepositoryPort,
      {
        findById: jest.fn().mockResolvedValue({
          id: "unit-1",
          levelId: "level-1",
          status: ContentStatus.PUBLISHED,
        }),
      } as unknown as UnitRepositoryPort,
      {
        findBySlug: jest.fn().mockResolvedValue(lesson),
      } as unknown as LessonRepositoryPort,
      {
        findByLessonId: jest.fn().mockResolvedValue([
          { vocabularyId: "vocabulary-2", sortOrder: 2 },
          { vocabularyId: "vocabulary-1", sortOrder: 1 },
        ]),
      },
      {
        findByIds: jest.fn().mockResolvedValue([
          { id: "vocabulary-1", status: ContentStatus.PUBLISHED },
          { id: "vocabulary-2", status: ContentStatus.PUBLISHED },
        ]),
      },
      {
        findByVocabularyIds: jest.fn().mockResolvedValue([]),
      },
      {
        findByLessonId: jest.fn().mockResolvedValue([]),
      },
    );
  }

  it("keeps lesson vocabulary in its configured order", async () => {
    const result = await createUseCase().execute("greeting");
    expect(result.vocabulary.map((item) => item.id)).toEqual([
      "vocabulary-1",
      "vocabulary-2",
    ]);
  });

  it("does not expose a published lesson below a draft level", async () => {
    await expect(
      createUseCase(ContentStatus.DRAFT).execute("greeting"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
