import { prisma } from "./prisma";
import { recordEvent } from "./sessions";

export interface WatchlistEntry {
  movieId: string;
  title: string;
  releaseYear: number | null;
  runtimeMinutes: number;
  overview: string;
  genres: string[];
  posterPath: string | null;
  savedAt: string;
}

export type AddWatchlistResult =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; reason: "movie_not_found" };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// Idempotent save: the (anonymousUserId, movieId) unique constraint makes
// duplicate saves a no-op; the analytics event fires only on first save.
export async function addToWatchlist(
  anonymousUserId: string,
  movieId: string
): Promise<AddWatchlistResult> {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { id: true },
  });
  if (!movie) {
    return { ok: false, reason: "movie_not_found" };
  }

  try {
    await prisma.watchlistItem.create({
      data: { anonymousUserId, movieId },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: true, alreadySaved: true };
    }
    throw error;
  }

  await recordEvent({
    anonymousUserId,
    eventType: "watchlist_added",
    movieId,
  });
  return { ok: true, alreadySaved: false };
}

export async function removeFromWatchlist(
  anonymousUserId: string,
  movieId: string
): Promise<number> {
  const result = await prisma.watchlistItem.deleteMany({
    where: { anonymousUserId, movieId },
  });
  return result.count;
}

export async function getWatchlist(anonymousUserId: string): Promise<WatchlistEntry[]> {
  const items = await prisma.watchlistItem.findMany({
    where: { anonymousUserId },
    orderBy: { createdAt: "desc" },
    include: { movie: true },
  });
  return items.map((item) => ({
    movieId: item.movie.id,
    title: item.movie.title,
    releaseYear: item.movie.releaseYear,
    runtimeMinutes: item.movie.runtimeMinutes,
    overview: item.movie.overview ?? "",
    genres: item.movie.genres,
    posterPath: item.movie.posterPath,
    savedAt: item.createdAt.toISOString(),
  }));
}
