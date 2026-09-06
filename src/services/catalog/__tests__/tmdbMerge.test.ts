import { tmdbEnrichmentFromMatch } from "../tmdbMerge";
import type { TmdbMatchRecord } from "../tmdbMerge";

const record = (overrides: Partial<TmdbMatchRecord> = {}): TmdbMatchRecord => ({
  tmdbId: 122906,
  confidence: "exact",
  matchMethod: "title_year_search",
  tmdbTitle: "About Time",
  tmdbOriginalTitle: "About Time",
  tmdbYear: 2013,
  tmdbRuntime: 123,
  runtimeVerified: true,
  needsReview: false,
  reviewedByHuman: false,
  ...overrides,
});

describe("tmdbEnrichmentFromMatch", () => {
  it("maps tmdbId and originalTitle from an approved record", () => {
    const result = tmdbEnrichmentFromMatch(record());
    expect(result).toEqual({ tmdbId: 122906, originalTitle: "About Time" });
  });

  it("returns tmdbId null for a missing record", () => {
    expect(tmdbEnrichmentFromMatch(undefined)).toEqual({ tmdbId: null });
  });

  it("returns tmdbId null for a record still under review", () => {
    const result = tmdbEnrichmentFromMatch(record({ needsReview: true, tmdbId: 999 }));
    expect(result).toEqual({ tmdbId: null });
    expect(result.originalTitle).toBeUndefined();
  });

  it("returns tmdbId null when the id is invalid", () => {
    expect(tmdbEnrichmentFromMatch(record({ tmdbId: null })).tmdbId).toBeNull();
    expect(tmdbEnrichmentFromMatch(record({ tmdbId: -5 })).tmdbId).toBeNull();
    expect(tmdbEnrichmentFromMatch(record({ tmdbId: 1.5 })).tmdbId).toBeNull();
  });

  it("omits originalTitle when blank", () => {
    const result = tmdbEnrichmentFromMatch(record({ tmdbOriginalTitle: "  " }));
    expect(result.originalTitle).toBeUndefined();
  });

  it("maps optional poster, backdrop and release date keys when present", () => {
    const result = tmdbEnrichmentFromMatch(
      record({
        tmdbPosterPath: "/abc.jpg",
        tmdbBackdropPath: "/xyz.jpg",
        tmdbReleaseDate: "2013-08-01",
      })
    );
    expect(result.posterPath).toBe("/abc.jpg");
    expect(result.backdropPath).toBe("/xyz.jpg");
    expect(result.releaseDate).toEqual(new Date("2013-08-01"));
  });

  it("skips poster/backdrop/releaseDate when absent or invalid (no invention)", () => {
    const result = tmdbEnrichmentFromMatch(record({ tmdbReleaseDate: "not-a-date" }));
    expect(result.posterPath).toBeUndefined();
    expect(result.backdropPath).toBeUndefined();
    expect(result.releaseDate).toBeUndefined();
  });

  it("does not map tmdbYear into releaseDate (year-only is not a date)", () => {
    const result = tmdbEnrichmentFromMatch(record());
    expect(result.releaseDate).toBeUndefined();
  });
});
