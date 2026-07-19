export const VALID_SECTIONS = [
  "hook",
  "problem",
  "consequence",
  "realization",
  "recommendation",
  "cta",
] as const;

export type SectionType = (typeof VALID_SECTIONS)[number];

// Urutan wajib — tiap section MUNCUL TEPAT 1x, index harus sesuai urutan ini
export const REQUIRED_SECTION_ORDER: SectionType[] = [
  "hook",
  "problem",
  "consequence",
  "realization",
  "recommendation",
  "cta",
];

export const MAX_RETRY = 2;
