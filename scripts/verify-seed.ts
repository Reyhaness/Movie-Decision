import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const total = await p.movie.count();
  const withTmdb = await p.movie.count({ where: { tmdbId: { not: null } } });
  const activeValidated = await p.movie.count({ where: { isActive: true, isValidated: true } });
  const moodScores = await p.movieMoodScore.count();
  const situationScores = await p.movieSituationScore.count();

  const overrides = await p.movie.findMany({
    where: { slug: { in: ["about-time", "arrival", "alien", "parasite"] } },
    select: { slug: true, tmdbId: true, title: true, releaseYear: true },
  });

  const duplicates = await p.movie.groupBy({
    by: ["slug"],
    _count: { _all: true },
    having: { slug: { _count: { gt: 1 } } },
  });

  const noTmdb = await p.movie.findMany({
    where: { tmdbId: null },
    select: { slug: true },
  });

  console.log(JSON.stringify(
    {
      totalMovies: total,
      withTmdbId: withTmdb,
      activeValidated: activeValidated,
      moodScoreRows: moodScores,
      situationScoreRows: situationScores,
      duplicateSlugGroups: duplicates.length,
      moviesWithoutTmdbId: noTmdb.map((m) => m.slug),
      manualOverrides: overrides.sort((a, b) => a.slug.localeCompare(b.slug)),
    },
    null,
    2
  ));
}

main()
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
