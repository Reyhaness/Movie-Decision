export interface TmdbMatchRecord {
  tmdbId: number | null;
  confidence: string;
  matchMethod: string | null;
  tmdbTitle: string | null;
  tmdbOriginalTitle: string | null;
  tmdbYear: number | null;
  tmdbRuntime: number | null;
  runtimeVerified: boolean;
  needsReview: boolean;
  reviewedByHuman: boolean;
  tmdbPosterPath?: string | null;
  tmdbBackdropPath?: string | null;
  tmdbReleaseDate?: string | null;
}

export interface TmdbEnrichment {
  tmdbId: number | null;
  originalTitle?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: Date;
}

export interface TmdbMatchFile {
  generatedAt: string;
  matches: Record<string, TmdbMatchRecord>;
  titleOverrides: Record<string, string>;
}

// The artifact is the source of truth for approved TMDB enrichment metadata.
// Only fully reviewed records with a valid tmdbId contribute data; everything
// else yields { tmdbId: null } so the DB never keeps a stale/ unapproved id.
// Curated fields (title, runtime, releaseYear, genres, overview, scores) are
// never produced here - they come from test-movies.ts only.
export function tmdbEnrichmentFromMatch(
  record: TmdbMatchRecord | undefined
): TmdbEnrichment {
  if (!record || record.needsReview) {
    return { tmdbId: null };
  }
  const tmdbId = typeof record.tmdbId === "number" && Number.isInteger(record.tmdbId) && record.tmdbId > 0
    ? record.tmdbId
    : null;
  if (tmdbId === null) {
    return { tmdbId: null };
  }

  const enrichment: TmdbEnrichment = { tmdbId };

  const originalTitle = cleanString(record.tmdbOriginalTitle);
  if (originalTitle) enrichment.originalTitle = originalTitle;

  const posterPath = cleanString(record.tmdbPosterPath);
  if (posterPath) enrichment.posterPath = posterPath;

  const backdropPath = cleanString(record.tmdbBackdropPath);
  if (backdropPath) enrichment.backdropPath = backdropPath;

  const releaseDate = parseReleaseDate(record.tmdbReleaseDate);
  if (releaseDate) enrichment.releaseDate = releaseDate;

  return enrichment;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseReleaseDate(value: unknown): Date | null {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
