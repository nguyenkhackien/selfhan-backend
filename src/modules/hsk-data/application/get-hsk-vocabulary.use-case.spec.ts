import { NotFoundException } from "@nestjs/common";
import { GetHskVocabularyUseCase } from "./get-hsk-vocabulary.use-case";
import { HskVocabularyRepositoryPort } from "./hsk-vocabulary.ports";

describe("GetHskVocabularyUseCase", () => {
  const repository: jest.Mocked<HskVocabularyRepositoryPort> = {
    listBands: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns the complete imported word and its ordered senses", async () => {
    const word = {
      id: "word-1",
      hskBand: 1,
      sourceOrder: 1,
      simplified: "爱好",
      pinyin: "ài hào",
      sinoViet: "Ái hảo",
      primaryMeaning: "sở thích",
      importStatus: "ready" as const,
      traditional: "愛好",
      frequency: 42,
      senses: ["sở thích", "thú vui"],
    };
    repository.findById.mockResolvedValue(word);

    await expect(
      new GetHskVocabularyUseCase(repository).execute(word.id),
    ).resolves.toEqual(word);
  });

  it("returns a safe not-found response when the vocabulary id is absent", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new GetHskVocabularyUseCase(repository).execute(
        "7de21ffb-9573-4c54-9a77-8a10e55aa88b",
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
