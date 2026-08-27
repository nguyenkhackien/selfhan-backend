import { ListHskVocabularyUseCase } from "./list-hsk-vocabulary.use-case";
import { HskVocabularyRepositoryPort } from "./hsk-vocabulary.ports";

describe("ListHskVocabularyUseCase", () => {
  const list = jest.fn();
  const repository: jest.Mocked<HskVocabularyRepositoryPort> = {
    listBands: jest.fn(),
    list,
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns an opaque next cursor after a bounded page", async () => {
    list.mockResolvedValue([
      {
        id: "word-1",
        hskBand: 1,
        sourceOrder: 1,
        simplified: "爱",
        pinyin: "ài",
        sinoViet: null,
        primaryMeaning: "yêu",
        importStatus: "needs_review",
      },
      {
        id: "word-2",
        hskBand: 1,
        sourceOrder: 2,
        simplified: "八",
        pinyin: "bā",
        sinoViet: "Bát",
        primaryMeaning: "tám",
        importStatus: "ready",
      },
      {
        id: "word-3",
        hskBand: 1,
        sourceOrder: 3,
        simplified: "吧",
        pinyin: "ba",
        sinoViet: "Ba",
        primaryMeaning: "nhé",
        importStatus: "ready",
      },
    ]);
    const useCase = new ListHskVocabularyUseCase(repository);

    const result = await useCase.execute({ band: 1, limit: 2 });

    expect(result.items.map((item) => item.id)).toEqual(["word-1", "word-2"]);
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(list).toHaveBeenCalledWith({
      band: 1,
      cursor: null,
      limit: 3,
      query: null,
    });
  });

  it("rejects an invalid cursor before querying the repository", async () => {
    const useCase = new ListHskVocabularyUseCase(repository);

    await expect(
      useCase.execute({ band: null, cursor: "not-a-cursor", limit: 20 }),
    ).rejects.toThrow("Invalid HSK vocabulary cursor.");
    expect(list).not.toHaveBeenCalled();
  });
});
