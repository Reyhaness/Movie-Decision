import { filterByTime, calculateDistance, buildCandidate, getMoodScore, getSituationScore } from "../filters";
import type { MovieCandidate } from "../types";

const c = (movieId: string, runtimeMinutes: number): MovieCandidate =>
  buildCandidate({ movieId, title: `T-${movieId}`, runtimeMinutes });

describe("time hard filter boundaries", () => {
  it("under_90 includes 89 and excludes 90", () => {
    const candidates = [c("a", 89), c("b", 90)];
    expect(filterByTime(candidates, "under_90").map((x) => x.movieId)).toEqual(["a"]);
  });

  it("90_to_120 includes 90 and 120, excludes 89 and 121", () => {
    const candidates = [c("a", 89), c("b", 90), c("c", 120), c("d", 121)];
    expect(filterByTime(candidates, "90_to_120").map((x) => x.movieId)).toEqual(["b", "c"]);
  });

  it("over_120 includes 121 and above, excludes 119 and 120", () => {
    const candidates = [c("a", 119), c("b", 120), c("c", 121), c("d", 180)];
    expect(filterByTime(candidates, "over_120").map((x) => x.movieId)).toEqual(["c", "d"]);
  });

  it("buckets are mutually exclusive (every runtime matches exactly one)", () => {
    const runtimes = [1, 59, 89, 90, 105, 120, 121, 150, 240];
    const buckets = ["under_90", "90_to_120", "over_120"] as const;
    for (const r of runtimes) {
      const matches = buckets.filter((b) => filterByTime([c("x", r)], b).length === 1);
      expect(matches).toHaveLength(1);
    }
  });

  it("returns empty array when nothing fits", () => {
    expect(filterByTime([c("a", 200)], "under_90")).toEqual([]);
  });
});

describe("distance formula", () => {
  it("computes (5-mood)^2 + (5-situation)^2", () => {
    expect(calculateDistance(5, 4)).toBe(1);
    expect(calculateDistance(4, 4)).toBe(2);
    expect(calculateDistance(5, 3)).toBe(4);
    expect(calculateDistance(3, 3)).toBe(8);
    expect(calculateDistance(2, 2)).toBe(18);
    expect(calculateDistance(3, 1)).toBe(20);
    expect(calculateDistance(5, 1)).toBe(16);
    expect(calculateDistance(5, 5)).toBe(0);
  });
});

describe("helpers", () => {
  it("extracts mood and situation scores correctly", () => {
    const candidate = buildCandidate({
      movieId: "test-helper",
      title: "Test Helper",
      runtimeMinutes: 95,
      moodScores: { emotional: 5 },
      situationScores: { partner: 4 },
    });

    expect(getMoodScore(candidate, "emotional")).toBe(5);
    expect(getSituationScore(candidate, "partner")).toBe(4);
    expect(candidate.genres).toEqual([]);
    expect(candidate.releaseYear).toBeNull();
  });
});
