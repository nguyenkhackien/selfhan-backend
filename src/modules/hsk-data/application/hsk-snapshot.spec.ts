import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface SnapshotEntry {
  readonly hskBand: number;
  readonly sourceOrder: number;
  readonly simplified: string;
}

interface HskSnapshot {
  readonly schemaVersion: number;
  readonly entries: readonly SnapshotEntry[];
  readonly reviewReport: {
    readonly totalEntries: number;
  };
}

describe("generated HSK snapshot", () => {
  const backendRoot = resolve(__dirname, "../../../..");
  const snapshot = JSON.parse(
    readFileSync(resolve(backendRoot, "data/hsk/hsk-3.0-vi.json"), "utf8"),
  ) as HskSnapshot;
  const sourceLock = JSON.parse(
    readFileSync(resolve(backendRoot, "data/hsk/sources.lock.json"), "utf8"),
  ) as {
    readonly sources: {
      readonly hsk: { readonly files: Readonly<Record<string, string>> };
    };
  };

  it("contains all pinned HSK 3.0 bands in the source order", () => {
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.entries).toHaveLength(10969);
    expect(snapshot.reviewReport.totalEntries).toBe(10969);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 1),
    ).toHaveLength(506);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 2),
    ).toHaveLength(750);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 3),
    ).toHaveLength(953);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 4),
    ).toHaveLength(972);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 5),
    ).toHaveLength(1059);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 6),
    ).toHaveLength(1123);
    expect(
      snapshot.entries.filter((entry) => entry.hskBand === 7),
    ).toHaveLength(5606);

    for (const band of [1, 2, 3, 4, 5, 6, 7]) {
      const sourceOrders = snapshot.entries
        .filter((entry) => entry.hskBand === band)
        .map((entry) => entry.sourceOrder);
      expect(sourceOrders).toEqual(sourceOrders.map((_, index) => index + 1));
    }
  });

  it("locks every HSK source file to a SHA-256 checksum", () => {
    const checksums = Object.values(sourceLock.sources.hsk.files);

    expect(checksums).toHaveLength(7);
    checksums.forEach((checksum) => expect(checksum).toMatch(/^[a-f0-9]{64}$/));
  });
});
