import { LearningStateService } from "./learning-state.service";

describe("LearningStateService", () => {
  it("scores only server-owned correct options and persists every answer", async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          { id: "quiz-1", lessonId: null, unitId: "unit-1", passingScore: 70 },
        ])
        .mockResolvedValueOnce([
          {
            id: "question-1",
            prompt: "one",
            type: "pinyin",
            audioUrl: null,
            sortOrder: 1,
          },
          {
            id: "question-2",
            prompt: "two",
            type: "pinyin",
            audioUrl: null,
            sortOrder: 2,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "option-1",
            questionId: "question-1",
            label: "a",
            isCorrect: true,
            sortOrder: 1,
          },
          {
            id: "option-2",
            questionId: "question-2",
            label: "b",
            isCorrect: false,
            sortOrder: 1,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "attempt-1",
            score: 50,
            questionCount: 2,
            submittedAt: "2026-08-28",
          },
        ])
        .mockResolvedValue([]),
    };
    const dataSource = {
      manager,
      transaction: (
        work: (transactionManager: typeof manager) => unknown,
      ): Promise<unknown> => Promise.resolve(work(manager)),
    };
    const service = new LearningStateService(dataSource as never);

    await expect(
      service.submitAttempt("user-1", "quiz-1", [
        { questionId: "question-1", selectedOptionId: "option-1" },
        { questionId: "question-2", selectedOptionId: "option-2" },
      ]),
    ).resolves.toMatchObject({
      score: 50,
      answers: [
        { questionId: "question-1", isCorrect: true },
        { questionId: "question-2", isCorrect: false },
      ],
    });

    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "quiz_answers"'),
      ["attempt-1", "question-1", "option-1", true],
    );
  });

  it("uses a deterministic one-day initial SRS interval for a good review", async () => {
    const manager = {
      query: jest.fn().mockResolvedValue([{ id: "vocabulary-1" }]),
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          vocabularyId: "vocabulary-1",
          rating: "good",
          nextReviewAt: "2026-08-29T00:00:00.000Z",
          srsStage: 1,
        },
      ]);
    const service = new LearningStateService({ manager, query } as never);

    await expect(
      service.review("user-1", "vocabulary-1", "good"),
    ).resolves.toMatchObject({
      srsStage: 1,
    });
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining("INTERVAL '1 day'"),
      ["user-1", "vocabulary-1", "good", 1, 1],
    );
  });
});
