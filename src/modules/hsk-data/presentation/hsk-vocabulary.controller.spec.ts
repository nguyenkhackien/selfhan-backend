import { IS_PUBLIC_KEY } from "../../auth/presentation/public.decorator";
import { HskVocabularyController } from "./hsk-vocabulary.controller";

describe("HskVocabularyController", () => {
  const listBandsUseCase = { execute: jest.fn() };
  const listVocabularyUseCase = { execute: jest.fn() };
  const getVocabularyUseCase = { execute: jest.fn() };
  const controller = new HskVocabularyController(
    listBandsUseCase as never,
    listVocabularyUseCase as never,
    getVocabularyUseCase as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("is explicitly public and maps bounded list query values", async () => {
    listVocabularyUseCase.execute.mockResolvedValue({
      items: [
        {
          id: "word-1",
          hskBand: 1,
          sourceOrder: 1,
          simplified: "爱",
          pinyin: "ài",
          sinoViet: "Ái",
          primaryMeaning: "yêu",
          importStatus: "ready",
        },
      ],
      nextCursor: "opaque-cursor",
    });

    await expect(
      controller.listVocabulary({
        band: "1",
        cursor: "opaque-cursor",
        limit: "20",
        query: "ái",
      }),
    ).resolves.toEqual({
      items: [
        {
          id: "word-1",
          hskBand: 1,
          sourceOrder: 1,
          simplified: "爱",
          pinyin: "ài",
          sinoViet: "Ái",
          primaryMeaning: "yêu",
          importStatus: "ready",
        },
      ],
      nextCursor: "opaque-cursor",
    });
    expect(listVocabularyUseCase.execute).toHaveBeenCalledWith({
      band: 1,
      cursor: "opaque-cursor",
      limit: 20,
      query: "ái",
    });
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, HskVocabularyController)).toBe(
      true,
    );
  });
});
