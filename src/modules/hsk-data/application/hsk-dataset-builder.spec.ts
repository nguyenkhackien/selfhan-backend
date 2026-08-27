import { buildHskDataset, type HskSourceInput } from "./hsk-dataset-builder";

describe("buildHskDataset", () => {
  const source: HskSourceInput = {
    hskByBand: new Map([
      [
        1,
        JSON.stringify([
          {
            simplified: "你好",
            traditional: "你好",
            forms: [{ pinyin: "nǐ hǎo" }],
          },
          { simplified: "车上", forms: [{ pinyin: "chē shàng" }] },
        ]),
      ],
    ]),
    cvdict: [
      "#! entries=2",
      "你好 你好 [ni3 hao3] /xin chào/bạn khỏe không/",
      "你好 你好 [ni3 hao3] /lời chào thân mật/",
    ].join("\n"),
    kaiHanzi: JSON.stringify([
      { hanzi: "你", sinoViet: "Nhĩ" },
      { hanzi: "好", sinoViet: "Hảo" },
    ]),
    unihanReadings: [
      "U+8F66\tkVietnamese\txa",
      "U+4E0A\tkVietnamese\tthượng",
    ].join("\n"),
    sourceRevisions: {
      hsk: "hsk-revision",
      cvdict: "cvdict-revision",
      kaiHanzi: "kai-revision",
      unihan: "unihan-revision",
    },
  };

  it("preserves every CVDICT sense and uses curated readings before Unihan", () => {
    const dataset = buildHskDataset(source);
    const hello = dataset.entries[0];

    expect(hello).toMatchObject({
      hskBand: 1,
      displayBand: "HSK 1",
      sourceOrder: 1,
      simplified: "你好",
      traditional: "你好",
      pinyin: "nǐ hǎo",
      sinoViet: "Nhĩ Hảo",
      importStatus: "ready",
      senses: ["xin chào", "bạn khỏe không", "lời chào thân mật"],
    });
  });

  it("marks entries missing a meaning or a complete character reading for review", () => {
    const dataset = buildHskDataset(source);
    const onVehicle = dataset.entries[1];

    expect(onVehicle).toMatchObject({
      simplified: "车上",
      sinoViet: "xa thượng",
      importStatus: "needs_review",
      senses: [],
    });
    expect(dataset.reviewReport).toEqual({
      totalEntries: 2,
      readyEntries: 1,
      needsReviewEntries: 1,
      missingVietnameseMeaning: ["车上"],
      missingSinoViet: [],
    });
  });

  it("does not invent a partial Sino-Vietnamese reading", () => {
    const dataset = buildHskDataset({
      ...source,
      unihanReadings: "U+8F66\tkVietnamese\txa",
    });

    expect(dataset.entries[1]?.sinoViet).toBeNull();
    expect(dataset.reviewReport.missingSinoViet).toEqual(["车上"]);
  });

  it("uses the traditional form when Unihan has no reading for a simplified character", () => {
    const dataset = buildHskDataset({
      ...source,
      hskByBand: new Map([
        [
          1,
          JSON.stringify([
            {
              simplified: "够",
              forms: [{ traditional: "夠", transcriptions: { pinyin: "gòu" } }],
            },
          ]),
        ],
      ]),
      unihanReadings: "U+5920\tkVietnamese\tcấu",
    });

    expect(dataset.entries[0]?.sinoViet).toBe("cấu");
  });
});
