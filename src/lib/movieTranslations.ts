import faOverviews from "../../messages/movie-overviews-fa.json";

const overviewsMap: Record<string, string> = faOverviews;

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
