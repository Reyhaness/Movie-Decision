import type {
  MovieCandidate,
  RecommendationContext,
  RecommendationResult,
} from "./types";
import type { RecommendationStrategy } from "./types";
import type { RecommendationInput } from "@/lib/validation";
import { filterByTime } from "./filters";
import { standardStrategy } from "./scoring";
import { surpriseMeStrategy } from "./surprise";
import { recommendationInputSchema } from "@/lib/validation";

export interface RecommendMovieArgs {
  input: RecommendationInput;
  candidates: readonly MovieCandidate[];
  excludedMovieIds?: readonly string[];
  strategy?: RecommendationStrategy;
}

// Orchestrator per RECOMMENDATION_SPEC.md §3: input validation, time hard filter,
// session exclusions, strategy selection, ONE movie result. Strategies are
// replaceable; the flow is not.
export function recommendMovie(args: RecommendMovieArgs): RecommendationResult {
  const parsed = recommendationInputSchema.safeParse(args.input);
  if (!parsed.success) {
    return {
      status: "no_candidates",
      reason: `Invalid input: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    };
  }
  const context: RecommendationContext = {
    time: parsed.data.time,
    mood: parsed.data.mood,
    situation: parsed.data.situation,
  };
  const excluded = new Set(args.excludedMovieIds ?? []);
  const timeFiltered = filterByTime(args.candidates, context.time).filter(
    (c) => !excluded.has(c.movieId)
  );
  if (timeFiltered.length === 0) {
    return { status: "no_candidates" };
  }
  const strategy = args.strategy ?? defaultStrategyFor(context);
  return strategy.select(timeFiltered, context);
}

function defaultStrategyFor(context: RecommendationContext): RecommendationStrategy {
  return context.mood === "surprise_me" ? surpriseMeStrategy : standardStrategy;
}
