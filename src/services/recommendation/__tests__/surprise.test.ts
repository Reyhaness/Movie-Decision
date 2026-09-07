import { surpriseMeStrategy } from "../surprise";
import { buildCandidate } from "../filters";
import { RECOMMENDATION_CONFIG } from "@/lib/constants";
import type { MovieCandidate, RecommendationContext } from "../types";

const makeCandidate = (movieId: string, situationScore: number): MovieCandidate =>
  buildCandidate({
    movieId,
    title: `Movie ${movieId}`,
    runtimeMinutes: 100,
    situationScores: { friends: situationScore },
  });

describe("surpriseMeStrategy", () => {
  const validContext: RecommendationContext = {
    time: "90_to_120",
    mood: "surprise_me",
    situation: "friends",
  };

  it("returns no_candidates when candidates array is empty", () => {
    const result = surpriseMeStrategy.select([], validContext);
    expect(result.status).toBe("no_candidates");
  });

  it("throws error if mood is not surprise_me", () => {
    const invalidContext: RecommendationContext = {
      time: "90_to_120",
      mood: "funny",
      situation: "friends",
    };
    expect(() =>
      surpriseMeStrategy.select([makeCandidate("a", 5)], invalidContext)
    ).toThrow("surpriseMeStrategy requires mood === 'surprise_me'");
  });

  it("returns no_strong_match if surprisePoolSize is null", () => {
    const originalPoolSize = RECOMMENDATION_CONFIG.surprisePoolSize;
    try {
      (RECOMMENDATION_CONFIG as { surprisePoolSize: number | null }).surprisePoolSize = null;
      const result = surpriseMeStrategy.select([makeCandidate("a", 5)], validContext);
      expect(result.status).toBe("no_strong_match");
      expect(result.reason).toContain("Surprise Me pool size is not configured");
    } finally {
      (RECOMMENDATION_CONFIG as { surprisePoolSize: number | null }).surprisePoolSize = originalPoolSize;
    }
  });

  it("selects from top-ranked candidates by situation score with correct fit", () => {
    // poolSize is 10, so create 10 top candidates and 1 low candidate
    const topCandidates = Array.from({ length: 10 }, (_, i) => makeCandidate(`top-${i}`, 5));
    const lowCandidate = makeCandidate("low", 1);
    const candidates = [lowCandidate, ...topCandidates];

    const result = surpriseMeStrategy.select(candidates, validContext);
    expect(result.status).toBe("success");
    expect(result.movie).toBeDefined();
    expect(result.movie?.movieId).not.toBe("low");
    expect(result.movie?.movieId.startsWith("top-")).toBe(true);
    expect(result.fit?.moodScore).toBeNull();
    expect(result.fit?.situationScore).toBe(5);
    expect(result.fit?.distance).toBe(0);
  });

  it("randomizes selection when multiple candidates are in the pool", () => {
    const candidates = Array.from({ length: 15 }, (_, i) => makeCandidate(`cand-${i}`, 5));
    const selectedIds = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const result = surpriseMeStrategy.select(candidates, validContext);
      if (result.movie) {
        selectedIds.add(result.movie.movieId);
      }
    }

    expect(selectedIds.size).toBeGreaterThan(1);
  });
});
