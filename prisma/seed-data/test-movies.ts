import type { TestMovieInput } from "@/services/catalog/testMovies";

// ============================================================================
// TEST MOVIE DATASET - to be filled in by the Product Designer
// ============================================================================
// Instructions:
//   1. Replace each placeholder entry below with a real curated movie.
//   2. Target: 20-30 movies (dataset targets defined in testMovies.ts).
//   3. Assign moodScores and situationScores per the rubrics in
//      Docs/ (Handoff §7-8, RECOMMENDATION_SPEC §17-18). Scores are 1-5.
//   4. Do NOT leave any 0 score - validation rejects unscored movies.
//   5. Keep runtimes accurate (they drive the hard time filter) and include
//      boundary cases: some <90, some 90-120 (incl. exactly 90/120), some 120+.
//   6. slug must be unique, lowercase kebab-case, e.g. "the-grand-budapest-hotel".
//   7. tmdbId is optional for now (used later for TMDB ingestion); leave null.
//
// Score 0 means "not scored yet" and is rejected by validation on purpose.
// This file is the scoring source of truth for the calibration dataset.
// ============================================================================

const placeholder = (slug: string): TestMovieInput => ({
  slug,
  title: "TODO",
  runtimeMinutes: 0,
  releaseYear: 0,
  genres: [],
  overview: "",
  tmdbId: null,
  moodScores: {
    cozy_relax: 0,
    funny: 0,
    thrill_tense: 0,
    emotional: 0,
    thoughtful_mind_bending: 0,
    epic: 0,
  },
  situationScores: {
    alone: 0,
    partner: 0,
    friends: 0,
    family: 0,
    kids: 0,
  },
});

// 24 placeholder slots. Rename slugs to real movies, fill every field,
// and add/remove slots to land within 20-30 total.
export const testMovies: TestMovieInput[] = [
  placeholder("test-movie-01"),
  placeholder("test-movie-02"),
  placeholder("test-movie-03"),
  placeholder("test-movie-04"),
  placeholder("test-movie-05"),
  placeholder("test-movie-06"),
  placeholder("test-movie-07"),
  placeholder("test-movie-08"),
  placeholder("test-movie-09"),
  placeholder("test-movie-10"),
  placeholder("test-movie-11"),
  placeholder("test-movie-12"),
  placeholder("test-movie-13"),
  placeholder("test-movie-14"),
  placeholder("test-movie-15"),
  placeholder("test-movie-16"),
  placeholder("test-movie-17"),
  placeholder("test-movie-18"),
  placeholder("test-movie-19"),
  placeholder("test-movie-20"),
  placeholder("test-movie-21"),
  placeholder("test-movie-22"),
  placeholder("test-movie-23"),
  placeholder("test-movie-24"),
];
