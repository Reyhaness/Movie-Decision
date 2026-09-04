import { standardStrategy } from "../scoring";
import { buildCandidate } from "../filters";
import type { MovieCandidate, RecommendationContext } from "../types";

const ctx: RecommendationContext = {
  time: "90_to_120",
  mood: "funny",
  situation: "friends",
};

const withScores = (
  movieId: string,
  moodScore: number,
  situationScore: number,
  runtimeMinutes = 100
): MovieCandidate =>
  buildCandidate({
    movieId,
    title: `T-${movieId}`,
    runtimeMinutes,
    moodScores: { funny: moodScore },
    situationScores: { friends: situationScore },
  });

describe("standard strategy (Strategy V1)", () => {
  it("prefers 5/5 over 4/5", () => {
    const result = standardStrategy.select([withScores("a", 4, 5), withScores("b", 5, 5)], ctx);
    expect(result.status).toBe("success");
    expect(result.movie?.movieId).toBe("b");
  });

  it("prefers 5/4 over 4/4", () => {
    const result = standardStrategy.select([withScores("a", 4, 4), withScores("b", 5, 4)], ctx);
    expect(result.movie?.movieId).toBe("b");
  });

  it("prefers balanced 3/3 over imbalanced 5/1 (5+1=6 vs 3+3=6)", () => {
    const result = standardStrategy.select([withScores("a", 5, 1), withScores("b", 3, 3)], ctx);
    expect(result.movie?.movieId).toBe("b");
  });

  it("prefers balanced 4/3 over imbalanced 2/5", () => {
    const result = standardStrategy.select([withScores("a", 2, 5), withScores("b", 4, 3)], ctx);
    expect(result.movie?.movieId).toBe("b");
  });

  it("breaks exact ties by mood score (5/3 vs 3/5 both distance 4 → mood wins)", () => {
    const result = standardStrategy.select([withScores("a", 3, 5), withScores("b", 5, 3)], ctx);
    expect(result.movie?.movieId).toBe("b");
    expect(result.fit?.distance).toBe(4);
  });

  it("reports fit scores and distance", () => {
    const result = standardStrategy.select([withScores("a", 5, 4)], ctx);
    expect(result.fit).toEqual({ moodScore: 5, situationScore: 4, distance: 1 });
  });

  it("returns no_candidates for empty input", () => {
    const result = standardStrategy.select([], ctx);
    expect(result.status).toBe("no_candidates");
  });

  it("randomizes among identical tie groups across draws", () => {
    const candidates = [withScores("a", 5, 5), withScores("b", 5, 5), withScores("c", 5, 5)];
    const winners = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const result = standardStrategy.select(candidates, ctx);
      if (result.movie) winners.add(result.movie.movieId);
    }
    expect(winners.size).toBeGreaterThan(1);
  });
});
