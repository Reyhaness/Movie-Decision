import { filterByTime, calculateDistance } from "../filters";
import { buildCandidate } from "../filters";
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

  it("over_120 includes 120 and above, excludes 119", () => {
    const candidates = [c("a", 119), c("b", 120), c("c", 180)];
    expect(filterByTime(candidates, "over_120").map((x) => x.movieId)).toEqual(["b", "c"]);
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
