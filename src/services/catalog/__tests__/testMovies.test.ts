import { validateTestMovies, toMovieCandidate } from "../testMovies";
import { recommendMovie } from "@/services/recommendation";
import type { TestMovieInput } from "../testMovies";

const validMovie = (slug: string, overrides: Partial<TestMovieInput> = {}): TestMovieInput => ({
  slug,
  title: `Movie ${slug}`,
  runtimeMinutes: 100,
  releaseYear: 2020,
  genres: [],
  overview: "",
  tmdbId: null,
  moodScores: { cozy_relax: 3, funny: 4, thrill_tense: 2, emotional: 3, thoughtful_mind_bending: 2, epic: 1 },
  situationScores: { alone: 3, partner: 4, friends: 5, family: 3, kids: 2 },
  ...overrides,
});

describe("test movie dataset validation", () => {
  it("accepts a fully scored movie, warning that the dataset is below target", () => {
    const { movies, issues, datasetWarning } = validateTestMovies([validMovie("a")]);
    expect(movies).toHaveLength(1);
    expect(issues).toHaveLength(0);
    expect(datasetWarning?.message).toContain("targets 20-30");
  });

  it("rejects unscored (0) values per field", () => {
    const movie = validMovie("a");
    movie.moodScores.funny = 0;
    const { movies, issues } = validateTestMovies([movie]);
    expect(movies).toHaveLength(0);
    expect(issues.some((i) => i.field === "moodScores.funny" && i.message.includes("not scored yet"))).toBe(true);
  });

  it("rejects out-of-range scores", () => {
    const movie = validMovie("a");
    movie.situationScores.kids = 6;
    const { issues } = validateTestMovies([movie]);
    expect(issues.some((i) => i.field === "situationScores.kids" && i.message.includes("between 1 and 5"))).toBe(true);
  });

  it("rejects invalid runtime and implausible release year", () => {
    const { issues } = validateTestMovies([
      validMovie("a", { runtimeMinutes: 0 }),
      validMovie("b", { releaseYear: 1800 }),
    ]);
    expect(issues.some((i) => i.slug === "a" && i.field === "runtimeMinutes")).toBe(true);
    expect(issues.some((i) => i.slug === "b" && i.field === "releaseYear")).toBe(true);
  });

  it("rejects duplicate slugs and malformed slugs", () => {
    const { issues } = validateTestMovies([validMovie("dup"), validMovie("dup"), validMovie("Bad Slug")]);
    expect(issues.filter((i) => i.field === "slug").length).toBeGreaterThanOrEqual(2);
  });

  it("warns (non-blocking) when scored count is below the 20-movie target", () => {
    const { datasetWarning } = validateTestMovies([validMovie("a"), validMovie("b"), validMovie("c")]);
    expect(datasetWarning).not.toBeNull();
    expect(datasetWarning?.message).toContain("targets 20-30");
  });

  it("treats placeholder TODO titles as unscored", () => {
    const { datasetWarning } = validateTestMovies([validMovie("a", { title: "TODO" })]);
    expect(datasetWarning).toBeNull();
  });
});

describe("seed dataset to engine pipeline", () => {
  it("maps a validated movie into an engine candidate that recommendMovie accepts", () => {
    const { movies } = validateTestMovies([
      validMovie("fit", { runtimeMinutes: 100 }),
      validMovie("long", { runtimeMinutes: 150 }),
    ]);
    const candidates = movies.map(toMovieCandidate);
    const result = recommendMovie({
      input: { time: "90_to_120", mood: "funny", situation: "friends" },
      candidates,
    });
    expect(result.status).toBe("success");
    expect(result.movie?.movieId).toBe("fit");
    expect(result.fit?.distance).toBe(1);
  });

  it("mapped candidates respect the time hard filter", () => {
    const { movies } = validateTestMovies([validMovie("long", { runtimeMinutes: 150 })]);
    const result = recommendMovie({
      input: { time: "under_90", mood: "funny", situation: "friends" },
      candidates: movies.map(toMovieCandidate),
    });
    expect(result.status).toBe("no_candidates");
  });
});
