import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { validateTestMovies } from "../src/services/catalog/testMovies";
import { searchMovies, fetchMovieDetails } from "../src/services/tmdb";
import { chooseBestMatch, runtimeVerifies, demoteIfRuntimeMismatch } from "../src/services/tmdb/matching";
import type { MatchConfidence } from "../src/services/tmdb/matching";
import { testMovies } from "../prisma/seed-data/test-movies";

interface MatchRecord {
  slug: string;
  curatedTitle: string;
  curatedYear: number;
  curatedRuntime: number;
  tmdbId: number | null;
  confidence: MatchConfidence;
  matchMethod: "title_year_search" | "manual_override" | null;
  tmdbTitle: string | null;
  tmdbOriginalTitle: string | null;
  tmdbYear: number | null;
  tmdbRuntime: number | null;
  runtimeVerified: boolean;
  needsReview: boolean;
  candidates: Array<{ tmdbId: number; title: string; year: number | null; score: number }>;
  reviewedByHuman: boolean;
}

interface MatchFile {
  generatedAt: string;
  matches: Record<string, MatchRecord>;
  titleOverrides: Record<string, string>;
}

const MATCHES_PATH = "prisma/seed-data/tmdb-matches.json";
const REQUEST_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadMatchFile(): MatchFile {
  if (existsSync(MATCHES_PATH)) {
    return JSON.parse(readFileSync(MATCHES_PATH, "utf-8")) as MatchFile;
  }
  return { generatedAt: new Date().toISOString(), matches: {}, titleOverrides: {} };
}

function saveMatchFile(file: MatchFile): void {
  file.generatedAt = new Date().toISOString();
  writeFileSync(MATCHES_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf-8");
}

async function searchWithTitle(title: string, year?: number) {
  // Primary: title + year (tightest query). Fallback: title only, so remakes
  // and metadata year drift are still findable. Matching still scores the year.
  if (year !== undefined) {
    const withYear = await searchMovies(title, { year });
    if (withYear.results.length > 0) return withYear.results;
  }
  const unfiltered = await searchMovies(title);
  return unfiltered.results;
}

async function enrichOne(
  movie: {
    slug: string;
    title: string;
    releaseYear: number;
    runtimeMinutes: number;
  },
  titleOverride?: string
): Promise<MatchRecord> {
  const searchTitle = titleOverride ?? movie.title;
  const results = await searchWithTitle(searchTitle, movie.releaseYear);
  const decision = chooseBestMatch({ title: movie.title, releaseYear: movie.releaseYear }, results);

  let confidence = decision.confidence;
  let tmdbId: number | null = null;
  let tmdbTitle: string | null = null;
  let tmdbOriginalTitle: string | null = null;
  let tmdbYear: number | null = null;
  let tmdbRuntime: number | null = null;
  let runtimeVerified = false;

  if (decision.best) {
    const details = await fetchMovieDetails(decision.best.tmdbId);
    tmdbId = details.id;
    tmdbTitle = details.title;
    tmdbOriginalTitle = details.original_title || null;
    tmdbYear = details.release_date ? Number.parseInt(details.release_date.slice(0, 4), 10) : null;
    tmdbRuntime = details.runtime ?? null;
    runtimeVerified = runtimeVerifies(movie.runtimeMinutes, tmdbRuntime);
    confidence = demoteIfRuntimeMismatch(decision, runtimeVerified).confidence;
    if (confidence === "likely" || confidence === "exact") {
      tmdbId = decision.best.tmdbId;
    } else {
      tmdbId = null;
    }
  }

  return {
    slug: movie.slug,
    curatedTitle: movie.title,
    curatedYear: movie.releaseYear,
    curatedRuntime: movie.runtimeMinutes,
    tmdbId,
    confidence,
    matchMethod: tmdbId !== null ? "title_year_search" : null,
    tmdbTitle,
    tmdbOriginalTitle,
    tmdbYear,
    tmdbRuntime,
    runtimeVerified,
    needsReview: tmdbId === null,
    candidates: decision.candidates.map((c) => ({
      tmdbId: c.tmdbId,
      title: c.title,
      year: c.releaseYear,
      score: c.score,
    })),
    reviewedByHuman: false,
  };
}

async function main() {
  const { movies: curated, issues, datasetWarning } = validateTestMovies(testMovies);
  if (issues.length > 0) {
    console.error(`[tmdb:enrich] Dataset has ${issues.length} validation issue(s):`);
    for (const issue of issues) console.error(`  [${issue.slug}] ${issue.field}: ${issue.message}`);
    process.exit(1);
  }
  if (datasetWarning) console.warn(`[tmdb:enrich] WARNING: ${datasetWarning.message}`);

  const matchFile = loadMatchFile();
  const pending = curated.filter((m) => {
    const existing = matchFile.matches[m.slug];
    return !existing || (existing.needsReview && !existing.reviewedByHuman);
  });

  console.log(`[tmdb:enrich] ${curated.length} curated movies; ${pending.length} pending TMDB lookup(s).`);
  let done = 0;
  for (const movie of pending) {
    try {
      matchFile.matches[movie.slug] = await enrichOne(movie, matchFile.titleOverrides[movie.slug]);
    } catch (error) {
      console.error(`[tmdb:enrich] FAILED for ${movie.slug}: ${error instanceof Error ? error.message : error}`);
      console.error("[tmdb:enrich] Progress saved; re-run to resume.");
      saveMatchFile(matchFile);
      process.exit(1);
    }
    done += 1;
    if (done % 10 === 0) {
      saveMatchFile(matchFile);
      console.log(`  progress: ${done}/${pending.length} (checkpoint saved)`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  saveMatchFile(matchFile);

  const records = Object.values(matchFile.matches);
  const byConfidence: Record<string, number> = { exact: 0, likely: 0, ambiguous: 0, missing: 0 };
  for (const r of records) byConfidence[r.confidence] = (byConfidence[r.confidence] ?? 0) + 1;

  console.log("\n[tmdb:enrich] Summary");
  console.log(`  auto-matched (exact):      ${byConfidence.exact}`);
  console.log(`  auto-matched (likely):     ${byConfidence.likely}`);
  console.log(`  needs review (ambiguous):  ${byConfidence.ambiguous}`);
  console.log(`  needs review (missing):    ${byConfidence.missing}`);
  const review = records.filter((r) => r.needsReview && !r.reviewedByHuman);
  if (review.length > 0) {
    console.log(`\n  Review needed for ${review.length} movie(s):`);
    for (const r of review) {
      const cand = r.candidates.map((c) => `${c.title} (${c.year ?? "?"}) [id=${c.tmdbId}]`).join("; ");
      console.log(`   - ${r.slug}: ${r.confidence}${cand ? ` — candidates: ${cand}` : " — no candidates"}`);
    }
    console.log("\n  Resolve in prisma/seed-data/tmdb-matches.json (set tmdbId or titleOverrides),");
    console.log("  mark reviewedByHuman=true, then re-run.");
  }
  console.log(`\n  Report: ${MATCHES_PATH}`);
}

main().catch((error) => {
  console.error("[tmdb:enrich] Fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
