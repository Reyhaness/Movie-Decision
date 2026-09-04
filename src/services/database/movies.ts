import { prisma } from "./prisma";
import { toMovieCandidate, MOOD_KEYS, SITUATION_KEYS } from "@/services/catalog/testMovies";
import type { MovieCandidate } from "@/services/recommendation/types";

export async function loadActiveCandidates(): Promise<MovieCandidate[]> {
  const movies = await prisma.movie.findMany({
    where: { isActive: true, isValidated: true },
    include: { moodScores: true, situationScores: true },
  });
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
    // The domain movieId is the database primary key so that events,
    // attempts and watchlist rows reference real movie records.
    return { ...candidate, movieId: movie.id };
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
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) return null;
  return {
    movieId: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    overview: movie.overview ?? "",
    genres: movie.genres,
    posterPath: movie.posterPath,
  };
}
