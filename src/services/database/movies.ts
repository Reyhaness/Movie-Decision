import { prisma } from "./prisma";
import { toMovieCandidate, MOOD_KEYS, SITUATION_KEYS } from "@/services/catalog/testMovies";
import type { MovieCandidate } from "@/services/recommendation/types";
import { testMovies } from "../../../prisma/seed-data/test-movies";
import tmdbMatchesData from "../../../prisma/seed-data/tmdb-matches.json";

const matchesMap = (tmdbMatchesData.matches ?? {}) as Record<
  string,
  { tmdbPosterPath?: string | null; tmdbBackdropPath?: string | null }
>;

export async function loadActiveCandidates(): Promise<MovieCandidate[]> {
  try {
    const movies = await prisma.movie.findMany({
      where: { isActive: true, isValidated: true },
      include: { moodScores: true, situationScores: true },
    });
    if (movies.length > 0) {
      return movies.map((movie) => {
        const moodScores = {} as Record<(typeof MOOD_KEYS)[number], number>;
        for (const key of MOOD_KEYS) {
          moodScores[key] = movie.moodScores.find((s) => s.mood === key)?.score ?? 3;
        }
        const situationScores = {} as Record<(typeof SITUATION_KEYS)[number], number>;
        for (const key of SITUATION_KEYS) {
          situationScores[key] =
            movie.situationScores.find((s) => s.situation === key)?.score ?? 3;
        }
        const candidate = toMovieCandidate({
          slug: movie.slug,
          title: movie.title,
          runtimeMinutes: movie.runtimeMinutes,
          releaseYear: movie.releaseYear ?? 0,
          genres: movie.genres,
          overview: movie.overview ?? "",
          tmdbId: movie.tmdbId,
          moodScores,
          situationScores,
        });
        return { ...candidate, movieId: movie.id };
      });
    }
  } catch {
    // Database connection error, fall through to in-memory catalog
  }

  return testMovies.map((m) => {
    const candidate = toMovieCandidate(m);
    return { ...candidate, movieId: m.slug };
  });
}

export interface MoviePayload {
  movieId: string;
  title: string;
  releaseYear: number | null;
  runtimeMinutes: number;
  overview: string;
  genres: string[];
  posterPath: string | null;
}

export async function loadMoviePayload(movieId: string): Promise<MoviePayload | null> {
  let movie: {
    id: string;
    slug: string;
    title: string;
    releaseYear: number | null;
    runtimeMinutes: number;
    overview: string | null;
    genres: string[];
    posterPath: string | null;
  } | null = null;

  try {
    movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      movie = await prisma.movie.findUnique({ where: { slug: movieId } });
    }
  } catch {
    // Database connection error, fall through to in-memory catalog
  }

  if (movie) {
    const match = matchesMap[movie.slug];
    const posterPath = movie.posterPath || match?.tmdbPosterPath || null;
    return {
      movieId: movie.id,
      title: movie.title,
      releaseYear: movie.releaseYear,
      runtimeMinutes: movie.runtimeMinutes,
      overview: movie.overview ?? "",
      genres: movie.genres,
      posterPath,
    };
  }

  const inMemory = testMovies.find(
    (m) => m.slug === movieId || m.title.toLowerCase() === movieId.toLowerCase()
  );
  if (inMemory) {
    const match = matchesMap[inMemory.slug];
    return {
      movieId: inMemory.slug,
      title: inMemory.title,
      releaseYear: inMemory.releaseYear,
      runtimeMinutes: inMemory.runtimeMinutes,
      overview: inMemory.overview ?? "",
      genres: inMemory.genres ?? [],
      posterPath: match?.tmdbPosterPath ?? null,
    };
  }

  return null;
}
