import type { TmdbSearchMovieResult } from "./types";

export type MatchConfidence = "exact" | "likely" | "ambiguous" | "missing";

export interface ScoredCandidate {
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  score: number;
}

export interface MatchDecision {
  confidence: MatchConfidence;
  best: ScoredCandidate | null;
  candidates: ScoredCandidate[];
}

export const RUNTIME_TOLERANCE_MIN = 3;
export const YEAR_TOLERANCE = 1;
const MIN_VIABLE_SCORE = 2;

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/^(the|a|an|der|die|das|le|la|les|el|los|las|il|lo|gli|un|una|o|a|os|as)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractYear(releaseDate: string | null): number | null {
  if (!releaseDate) return null;
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function scoreTitleMatch(curatedTitle: string, candidateTitle: string): number {
  const a = normalizeTitle(curatedTitle);
  const b = normalizeTitle(candidateTitle);
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 6;
  if (b.startsWith(a) || a.startsWith(b)) return 4;
  if (b.includes(a) || a.includes(b)) return 3;
  return 0;
}

export function scoreYearMatch(curatedYear: number, candidateYear: number | null): number {
  if (candidateYear === null) return 0;
  const delta = Math.abs(curatedYear - candidateYear);
  if (delta === 0) return 3;
  if (delta <= YEAR_TOLERANCE) return 2;
  return 0;
}

export function scoreCandidate(
  curated: { title: string; releaseYear: number },
  candidate: TmdbSearchMovieResult
): ScoredCandidate {
  const score =
    scoreTitleMatch(curated.title, candidate.title) +
    scoreTitleMatch(curated.title, candidate.original_title ?? candidate.title) +
    scoreYearMatch(curated.releaseYear, extractYear(candidate.release_date));
  return {
    tmdbId: candidate.id,
    title: candidate.title,
    originalTitle: candidate.original_title ?? null,
    releaseYear: extractYear(candidate.release_date),
    score,
  };
}

export function chooseBestMatch(
  curated: { title: string; releaseYear: number },
  results: readonly TmdbSearchMovieResult[]
): MatchDecision {
  const scored = results
    .map((r) => scoreCandidate(curated, r))
    .filter((c) => c.score >= MIN_VIABLE_SCORE)
    .sort((x, y) => y.score - x.score || x.tmdbId - y.tmdbId);

  if (scored.length === 0) {
    return { confidence: "missing", best: null, candidates: [] };
  }

  const best = scored[0];
  const hasExactTitle =
    normalizeTitle(curated.title) === normalizeTitle(best.title) ||
    (best.originalTitle !== null && normalizeTitle(curated.title) === normalizeTitle(best.originalTitle));
  const yearAligned =
    best.releaseYear !== null && Math.abs(curated.releaseYear - best.releaseYear) <= YEAR_TOLERANCE;

  const isClearWinner =
    scored.length === 1 ||
    best.score - scored[1].score >= 3 ||
    (hasExactTitle && best.score > scored[1].score);

  if (isClearWinner && hasExactTitle && yearAligned) {
    return { confidence: "exact", best, candidates: scored.slice(0, 5) };
  }
  if (isClearWinner && hasExactTitle) {
    return { confidence: "likely", best, candidates: scored.slice(0, 5) };
  }
  return { confidence: "ambiguous", best: null, candidates: scored.slice(0, 5) };
}

export function runtimeVerifies(
  curatedRuntime: number,
  tmdbRuntime: number | null,
  tolerance = RUNTIME_TOLERANCE_MIN
): boolean {
  if (tmdbRuntime === null) return false;
  return Math.abs(curatedRuntime - tmdbRuntime) <= tolerance;
}

export function demoteIfRuntimeMismatch(
  decision: MatchDecision,
  verified: boolean
): MatchDecision {
  if (verified || decision.best === null) return decision;
  if (decision.confidence === "exact") {
    return { ...decision, confidence: "likely" };
  }
  return { ...decision, confidence: "ambiguous" };
}
