import faOverviews from "../../messages/movie-overviews-fa.json";
import faTitles from "../../messages/movie-titles-fa.json";

const overviewsMap: Record<string, string> = faOverviews;
const titlesMap: Record<string, string> = faTitles;

function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMovieOverview(
  identifier: { movieId?: string; title?: string; overview?: string },
  locale: string
): string {
  const fallback = identifier.overview ?? "";
  if (locale !== "fa") {
    return fallback;
  }

  if (identifier.movieId) {
    const byId =
      overviewsMap[identifier.movieId] || overviewsMap[normalizeSlug(identifier.movieId)];
    if (byId) return byId;
  }

  if (identifier.title) {
    const byTitle = overviewsMap[normalizeSlug(identifier.title)];
    if (byTitle) return byTitle;
  }

  return fallback;
}

export function getMovieTitle(
  identifier: { movieId?: string; title?: string },
  locale: string
): { primaryTitle: string; originalTitle?: string } {
  const rawTitle = identifier.title ?? "";
  if (locale !== "fa") {
    return { primaryTitle: rawTitle };
  }

  let faTitle: string | undefined;

  if (identifier.movieId) {
    faTitle =
      titlesMap[identifier.movieId] || titlesMap[normalizeSlug(identifier.movieId)];
  }

  if (!faTitle && identifier.title) {
    faTitle = titlesMap[normalizeSlug(identifier.title)];
  }

  if (faTitle) {
    return {
      primaryTitle: faTitle,
      originalTitle: rawTitle && rawTitle !== faTitle ? rawTitle : undefined,
    };
  }

  return { primaryTitle: rawTitle };
}
