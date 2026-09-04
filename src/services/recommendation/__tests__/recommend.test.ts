import { recommendMovie } from "../recommend";
import { buildCandidate } from "../filters";
import type { MovieCandidate } from "../types";
import type { RecommendationStrategy } from "../types";

const base = (
  movieId: string,
  runtimeMinutes: number,
  overrides: {
    mood?: Partial<Record<string, number>>;
    situation?: Partial<Record<string, number>>;
  } = {}
): MovieCandidate =>
  buildCandidate({
    movieId,
    title: `T-${movieId}`,
    runtimeMinutes,
    moodScores: overrides.mood,
    situationScores: overrides.situation,
  });

const validInput = { time: "90_to_120", mood: "funny", situation: "friends" } as const;

describe("recommendMovie orchestration", () => {
  it("applies time filter before strategy", () => {
    const candidates = [
      base("short", 80, { mood: { funny: 5 }, situation: { friends: 5 } }),
      base("fit", 100, { mood: { funny: 5 }, situation: { friends: 5 } }),
    ];
    const result = recommendMovie({ input: validInput, candidates });
    expect(result.movie?.movieId).toBe("fit");
  });

  it("returns no_candidates when time filter empties the pool", () => {
    const result = recommendMovie({ input: { ...validInput, time: "under_90" }, candidates: [base("a", 130)] });
    expect(result.status).toBe("no_candidates");
  });

  it("rejects invalid taxonomy input", () => {
    const result = recommendMovie({
      input: { ...validInput, mood: "not_a_mood" } as unknown as typeof validInput,
      candidates: [base("a", 100)],
    });
    expect(result.status).toBe("no_candidates");
    expect(result.reason).toMatch(/Invalid input/);
  });

  it("routes surprise_me to the surprise strategy", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
      const result = recommendMovie({
        input: { ...validInput, mood: "surprise_me" },
        candidates: [
          base("a", 100, { situation: { friends: 5 } }),
          base("b", 100, { situation: { friends: 2 } }),
        ],
      });
      expect(result.status).toBe("success");
      expect(result.movie?.movieId).toBe("a");
      expect(result.fit?.moodScore).toBeNull();

      randomSpy.mockReturnValue(0.999999);
      const fromPoolTail = recommendMovie({
        input: { ...validInput, mood: "surprise_me" },
        candidates: [
          base("a", 100, { situation: { friends: 5 } }),
          base("b", 100, { situation: { friends: 2 } }),
        ],
      });
      expect(fromPoolTail.movie?.movieId).toBe("b");
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("excludes movies shown previously in the session", () => {
    const candidates = [
      base("shown", 100, { mood: { funny: 5 }, situation: { friends: 5 } }),
      base("fresh", 100, { mood: { funny: 4 }, situation: { friends: 4 } }),
    ];
    const result = recommendMovie({
      input: validInput,
      candidates,
      excludedMovieIds: ["shown"],
    });
    expect(result.movie?.movieId).toBe("fresh");
  });

  it("accepts an injected strategy without changing the flow", () => {
    const injected: RecommendationStrategy = {
      id: "test_strategy",
      select: (candidates) => ({
        status: "success",
        movie: candidates[candidates.length - 1],
        fit: { moodScore: null, situationScore: 0, distance: 0 },
      }),
    };
    const result = recommendMovie({
      input: validInput,
      candidates: [base("a", 100), base("b", 110)],
      strategy: injected,
    });
    expect(result.movie?.movieId).toBe("b");
  });

  it("try another returns a different movie with same constraints", () => {
    const candidates = [
      base("first", 100, { mood: { funny: 5 }, situation: { friends: 5 } }),
      base("second", 100, { mood: { funny: 5 }, situation: { friends: 5 } }),
    ];
    const first = recommendMovie({ input: validInput, candidates });
    const remaining = candidates.filter((c) => c.movieId !== first.movie?.movieId);
    const second = recommendMovie({ input: validInput, candidates: remaining });
    expect(second.movie?.movieId).not.toBe(first.movie?.movieId);
  });
});
