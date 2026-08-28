import { ListHskBandsUseCase } from "./list-hsk-bands.use-case";
import { HskVocabularyRepositoryPort } from "./hsk-vocabulary.ports";

describe("ListHskBandsUseCase", () => {
  it("returns the repository's bounded display bands without mutation", async () => {
    const bands = [
      { band: 1, displayBand: "HSK 1", count: 506 },
      { band: 7, displayBand: "HSK 7–9", count: 5606 },
    ];
    const repository: jest.Mocked<HskVocabularyRepositoryPort> = {
      listBands: jest.fn().mockResolvedValue(bands),
      list: jest.fn(),
      findById: jest.fn(),
    };

    await expect(
      new ListHskBandsUseCase(repository).execute(),
    ).resolves.toEqual(bands);
    expect(repository.listBands.mock.calls).toHaveLength(1);
  });
});
