# HSK Vocabulary Data License And Attribution

## Scope

This directory contains a normalized local snapshot for SelfHan. It is data,
not application source code. The snapshot is built from pinned upstream
revisions recorded in [sources.lock.json](sources.lock.json).

## Attribution

Vietnamese vocabulary meanings are derived from
[CVDICT](https://github.com/ph0ngp/CVDICT) and the
[CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) data
lineage. They are available under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The application must preserve this attribution wherever the vocabulary data is
displayed or exported. An export feature added later must include this notice
in its metadata.

## Source Materials

- HSK 3.0 word membership and source order:
  [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)
  (MIT).
- Vietnamese meanings:
  [CVDICT](https://github.com/ph0ngp/CVDICT) (CC BY-SA 4.0).
- Curated Hán–Việt character readings:
  [hanzi-sino-vietnamese](https://github.com/binhbuithithanh/hanzi-sino-vietnamese)
  (CC BY 4.0).
- Fallback Hán–Việt character readings: Unicode Unihan kVietnamese
  ([Unicode License v3](https://www.unicode.org/license.html)).

## SelfHan Modifications

- Filtered the source list to HSK 3.0 bands 1–6 and the source's combined
  HSK 7–9 list.
- Preserved the original word order inside each band.
- Matched CVDICT entries by simplified Chinese and preserved every matched
  Vietnamese sense in source order.
- Used curated Hán–Việt readings first, then Unicode Unihan kVietnamese.
  When a complete reading or Vietnamese meaning is unavailable, the entry is
  marked needs_review; SelfHan does not generate a replacement.
- Added source revisions, checksums, import status, and a generated
  [review-report.json](review-report.json).

## Rebuilding

The temporary upstream copies belong in data/hsk/.source-cache/, which is
intentionally ignored by Git. The build validates every file against the
locked SHA-256 checksum before replacing generated output:

```sh
npm run hsk:build
```

To use another local cache location:

```sh
HSK_SOURCE_DIR=/absolute/path/to/cache npm run hsk:build
```
