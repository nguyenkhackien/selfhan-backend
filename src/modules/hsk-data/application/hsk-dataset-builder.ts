export type HskImportStatus = "ready" | "needs_review";

export interface HskSourceRevisions {
  readonly hsk: string;
  readonly cvdict: string;
  readonly kaiHanzi: string;
  readonly unihan: string;
}

export interface HskSourceInput {
  readonly hskByBand: ReadonlyMap<number, string>;
  readonly cvdict: string;
  readonly kaiHanzi: string;
  readonly unihanReadings: string;
  readonly sourceRevisions: HskSourceRevisions;
}

export interface HskDatasetEntry {
  readonly hskBand: number;
  readonly displayBand: string;
  readonly sourceOrder: number;
  readonly simplified: string;
  readonly traditional: string | null;
  readonly pinyin: string;
  readonly frequency: number | null;
  readonly sinoViet: string | null;
  readonly importStatus: HskImportStatus;
  readonly senses: readonly string[];
  readonly sourceRevisions: HskSourceRevisions;
}

export interface HskDataset {
  readonly schemaVersion: 1;
  readonly entries: readonly HskDatasetEntry[];
  readonly characterReadings: readonly HskCharacterReading[];
  readonly reviewReport: HskReviewReport;
}

export type HskCharacterReadingSource = "kai_hanzi" | "unihan";

export interface HskCharacterReading {
  readonly hanzi: string;
  readonly sinoViet: string;
  readonly source: HskCharacterReadingSource;
  readonly sourceRevision: string;
}

export interface HskReviewReport {
  readonly totalEntries: number;
  readonly readyEntries: number;
  readonly needsReviewEntries: number;
  readonly missingVietnameseMeaning: readonly string[];
  readonly missingSinoViet: readonly string[];
}

interface HskSourceWord {
  readonly simplified: string;
  readonly traditional: string | null;
  readonly pinyin: string;
  readonly frequency: number | null;
}

interface HskSourceForm {
  readonly pinyin?: unknown;
  readonly frequency?: unknown;
  readonly traditional?: unknown;
  readonly transcriptions?: unknown;
}

interface HskSourceRow {
  readonly simplified?: unknown;
  readonly traditional?: unknown;
  readonly forms?: unknown;
}

interface Reading {
  readonly sinoViet: string;
  readonly source: HskCharacterReadingSource;
}

const CVDICT_LINE = /^(\S+)\s+(\S+)\s+\[([^\]]+)]\s+\/(.*)\/$/;
const UNIHAN_CODE_POINT = /^U\+([0-9A-F]{4,6})$/;

export function buildHskDataset(source: HskSourceInput): HskDataset {
  const meaningsBySimplified = parseCvdict(source.cvdict);
  const readingsByCharacter = new Map<string, Reading>([
    ...toReadings(
      parseUnihanVietnameseReadings(source.unihanReadings),
      "unihan",
    ),
    ...toReadings(parseKaiHanziReadings(source.kaiHanzi), "kai_hanzi"),
  ]);
  const entries: HskDatasetEntry[] = [];
  const missingVietnameseMeaning: string[] = [];
  const missingSinoViet: string[] = [];
  const usedCharacters = new Set<string>();

  for (const [hskBand, hskJson] of source.hskByBand) {
    const words = parseHskWords(hskJson);

    words.forEach((word, index) => {
      const senses = meaningsBySimplified.get(word.simplified) ?? [];
      const readingWord = word.traditional ?? word.simplified;
      Array.from(readingWord).forEach((character) =>
        usedCharacters.add(character),
      );
      const sinoViet = toSinoViet(readingWord, readingsByCharacter);
      const importStatus: HskImportStatus =
        senses.length > 0 && sinoViet !== null ? "ready" : "needs_review";

      if (senses.length === 0) {
        missingVietnameseMeaning.push(word.simplified);
      }
      if (sinoViet === null) {
        missingSinoViet.push(word.simplified);
      }

      entries.push({
        hskBand,
        displayBand: hskBand === 7 ? "HSK 7–9" : `HSK ${hskBand}`,
        sourceOrder: index + 1,
        simplified: word.simplified,
        traditional: word.traditional,
        pinyin: word.pinyin,
        frequency: word.frequency,
        sinoViet,
        importStatus,
        senses,
        sourceRevisions: source.sourceRevisions,
      });
    });
  }

  const readyEntries = entries.filter(
    (entry) => entry.importStatus === "ready",
  ).length;
  const characterReadings = Array.from(usedCharacters)
    .map((hanzi) => {
      const reading = readingsByCharacter.get(hanzi);
      if (reading === undefined) {
        return null;
      }

      return {
        hanzi,
        sinoViet: reading.sinoViet,
        source: reading.source,
        sourceRevision:
          reading.source === "kai_hanzi"
            ? source.sourceRevisions.kaiHanzi
            : source.sourceRevisions.unihan,
      };
    })
    .filter((reading): reading is HskCharacterReading => reading !== null)
    .sort((left, right) => left.hanzi.localeCompare(right.hanzi, "zh-Hans-CN"));

  return {
    schemaVersion: 1,
    entries,
    characterReadings,
    reviewReport: {
      totalEntries: entries.length,
      readyEntries,
      needsReviewEntries: entries.length - readyEntries,
      missingVietnameseMeaning,
      missingSinoViet,
    },
  };
}

function toReadings(
  readings: ReadonlyMap<string, string>,
  source: HskCharacterReadingSource,
): readonly [string, Reading][] {
  return Array.from(readings, ([hanzi, sinoViet]) => [
    hanzi,
    { sinoViet, source },
  ]);
}

function parseHskWords(json: string): readonly HskSourceWord[] {
  const value: unknown = JSON.parse(json);
  if (!Array.isArray(value)) {
    throw new Error("HSK source must be a JSON array.");
  }

  return value.map((row, index) => {
    if (
      !isRecord(row) ||
      typeof row.simplified !== "string" ||
      row.simplified.length === 0
    ) {
      throw new Error(`HSK source entry ${index + 1} has no simplified word.`);
    }

    const form = firstForm(row.forms, index);
    const pinyin = getPinyin(form);
    if (pinyin === null) {
      throw new Error(`HSK source entry ${index + 1} has no pinyin.`);
    }

    return {
      simplified: row.simplified,
      traditional: getTraditional(row, form),
      pinyin,
      frequency: typeof row.frequency === "number" ? row.frequency : null,
    };
  });
}

function getPinyin(form: HskSourceForm): string | null {
  if (typeof form.pinyin === "string" && form.pinyin.length > 0) {
    return form.pinyin;
  }
  if (
    !isRecord(form.transcriptions) ||
    typeof form.transcriptions.pinyin !== "string"
  ) {
    return null;
  }

  return form.transcriptions.pinyin.length > 0
    ? form.transcriptions.pinyin
    : null;
}

function getTraditional(row: HskSourceRow, form: HskSourceForm): string | null {
  const traditional =
    typeof form.traditional === "string" ? form.traditional : row.traditional;
  return typeof traditional === "string" && traditional.length > 0
    ? traditional
    : null;
}

function firstForm(value: unknown, index: number): HskSourceForm {
  if (!Array.isArray(value) || value.length === 0 || !isRecord(value[0])) {
    throw new Error(`HSK source entry ${index + 1} has no forms.`);
  }

  return value[0];
}

function parseCvdict(contents: string): ReadonlyMap<string, readonly string[]> {
  const meaningsBySimplified = new Map<string, string[]>();

  for (const line of contents.split(/\r?\n/u)) {
    if (line.length === 0 || line.startsWith("#") || line.startsWith("%")) {
      continue;
    }

    const match = CVDICT_LINE.exec(line);
    if (match === null) {
      continue;
    }

    const simplified = match[2];
    const rawSenses = match[4];
    if (simplified === undefined || rawSenses === undefined) {
      continue;
    }
    const senses = rawSenses
      .split("/")
      .map((sense) => sense.trim())
      .filter((sense) => sense.length > 0);

    if (senses.length === 0) {
      continue;
    }

    const existing = meaningsBySimplified.get(simplified) ?? [];
    existing.push(...senses);
    meaningsBySimplified.set(simplified, existing);
  }

  return meaningsBySimplified;
}

function parseKaiHanziReadings(contents: string): ReadonlyMap<string, string> {
  const value: unknown = JSON.parse(contents);
  if (!Array.isArray(value)) {
    throw new Error("Hanzi-Sino-Vietnamese source must be a JSON array.");
  }

  const readings = new Map<string, string>();
  for (const row of value) {
    if (!isRecord(row)) {
      continue;
    }

    const character = row.hanzi;
    const reading = row.sinoViet;
    if (
      typeof character === "string" &&
      Array.from(character).length === 1 &&
      typeof reading === "string" &&
      reading.length > 0
    ) {
      readings.set(character, reading);
    }
  }

  return readings;
}

function parseUnihanVietnameseReadings(
  contents: string,
): ReadonlyMap<string, string> {
  const readings = new Map<string, string>();

  for (const line of contents.split(/\r?\n/u)) {
    const [codePoint, property, value] = line.split("\t");
    const match =
      codePoint === undefined ? null : UNIHAN_CODE_POINT.exec(codePoint);
    if (property !== "kVietnamese" || value === undefined || match === null) {
      continue;
    }

    const hexadecimal = match[1];
    const reading = value.trim().split(/\s+/u)[0];
    if (
      hexadecimal === undefined ||
      reading === undefined ||
      reading.length === 0
    ) {
      continue;
    }
    const character = String.fromCodePoint(Number.parseInt(hexadecimal, 16));
    if (reading.length > 0) {
      readings.set(character, reading);
    }
  }

  return readings;
}

function toSinoViet(
  word: string,
  readingsByCharacter: ReadonlyMap<string, Reading>,
): string | null {
  const readings = Array.from(word).map((character) =>
    readingsByCharacter.get(character),
  );
  if (readings.some((reading) => reading === undefined)) {
    return null;
  }

  return readings.map((reading) => reading?.sinoViet).join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
