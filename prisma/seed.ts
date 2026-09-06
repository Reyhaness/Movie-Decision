import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { ScoredMood, SituationPreference } from "@prisma/client";
import { validateTestMovies } from "../src/services/catalog/testMovies";
import { tmdbEnrichmentFromMatch } from "../src/services/catalog/tmdbMerge";
import type { TmdbMatchFile } from "../src/services/catalog/tmdbMerge";
import { testMovies } from "./seed-data/test-movies";

const prisma = new PrismaClient();

// Approved TMDB enrichment artifact (source of truth for TMDB-owned fields
// only). Read from disk; no TMDB API client is imported and no network calls
// are made during seeding.
function loadTmdbMatches(): TmdbMatchFile {
  const raw = readFileSync(resolve(__dirname, "seed-data", "tmdb-matches.json"), "utf-8");
  return JSON.parse(raw) as TmdbMatchFile;
}

interface SeedArgs {
  checkOnly: boolean;
}

function parseArgs(): SeedArgs {
  return { checkOnly: process.argv.includes("--check") };
}

function printIssues(issues: ReturnType<typeof validateTestMovies>["issues"]): void {
  if (issues.length === 0) return;
  console.error(`\n${issues.length} validation issue(s):`);
  for (const issue of issues) {
    console.error(`  [${issue.slug}] ${issue.field}: ${issue.message}`);
  }
}

async function main(): Promise<void> {
  const { checkOnly } = parseArgs();
  const { movies, issues } = validateTestMovies(testMovies);

  console.log(`Test movie dataset: ${movies.length} valid / ${testMovies.length} entries`);

  if (issues.length > 0) {
    printIssues(issues);
  }

  if (movies.length === 0) {
    console.error("\nNo valid movies to seed. Fill in prisma/seed-data/test-movies.ts first.");
    process.exit(1);
  }

  if (checkOnly) {
    console.log("Validation-only run (no database writes). Dataset is seedable.");
    return;
  }

  const runtimeBuckets = {
    under_90: movies.filter((m) => m.runtimeMinutes < 90).length,
    "90_to_120": movies.filter((m) => m.runtimeMinutes >= 90 && m.runtimeMinutes <= 120).length,
    over_120: movies.filter((m) => m.runtimeMinutes >= 120).length,
  };
  console.log("Runtime bucket coverage:", runtimeBuckets);

  const matchFile = loadTmdbMatches();
  const withTmdbId = movies.filter((m) => {
    const rec = matchFile.matches[m.slug];
    return rec && !rec.needsReview && typeof rec.tmdbId === "number" && rec.tmdbId > 0;
  }).length;
  const missingTmdb = movies.filter((m) => {
    const rec = matchFile.matches[m.slug];
    return !rec || rec.needsReview || !rec.tmdbId;
  }).map((m) => m.slug);
  console.log(`TMDB enrichment: ${withTmdbId}/${movies.length} movies with approved tmdbId`);
  if (missingTmdb.length > 0) {
    console.warn(`TMDB enrichment: no approved match for ${missingTmdb.length}: ${missingTmdb.join(", ")}`);
  }

  for (const movie of movies) {
    const { tmdbId, ...optionalTmdb } = tmdbEnrichmentFromMatch(matchFile.matches[movie.slug]);
    const data = {
      slug: movie.slug,
      title: movie.title,
      runtimeMinutes: movie.runtimeMinutes,
      releaseYear: movie.releaseYear,
      genres: movie.genres ?? [],
      overview: movie.overview ?? "",
      tmdbId,
      isValidated: true,
      isActive: true,
    };
    const saved = await prisma.movie.upsert({
      where: { slug: movie.slug },
      update: { ...data, ...optionalTmdb, updatedAt: new Date() },
      create: { ...data, ...optionalTmdb },
    });

    for (const [mood, score] of Object.entries(movie.moodScores)) {
      await prisma.movieMoodScore.upsert({
        where: { movieId_mood: { movieId: saved.id, mood: mood as ScoredMood } },
        update: { score },
        create: { movieId: saved.id, mood: mood as ScoredMood, score },
      });
    }
    for (const [situation, score] of Object.entries(movie.situationScores)) {
      await prisma.movieSituationScore.upsert({
        where: { movieId_situation: { movieId: saved.id, situation: situation as SituationPreference } },
        update: { score },
        create: { movieId: saved.id, situation: situation as SituationPreference, score },
      });
    }
    console.log(`  seeded: ${movie.slug} (${movie.title})`);  }

  console.log(`\nDone. ${movies.length} movie(s) seeded with scores (isValidated=true, isActive=true).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
