import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { HskVocabularyQueryDto } from "./hsk-vocabulary.dto";

describe("HskVocabularyQueryDto", () => {
  it("allows only the documented bounded HSK query inputs", async () => {
    const value = plainToInstance(HskVocabularyQueryDto, {
      band: "7",
      cursor: "Abc_123-xyz",
      limit: "50",
      query: "thử tìm",
    });

    await expect(validate(value)).resolves.toEqual([]);
  });

  it.each([{ band: "8" }, { limit: "51" }, { cursor: "cursor with space" }])(
    "rejects invalid bounded input %#",
    async (input) => {
      const value = plainToInstance(HskVocabularyQueryDto, input);

      expect(await validate(value)).not.toEqual([]);
    },
  );
});
