import type { RecommendationStrategy } from "./types";
import { RECOMMENDATION_CONFIG } from "@/lib/constants";

// Surprise Me strategy per RECOMMENDATION_SPEC.md §12: time filter already applied
// upstream; rank by situation fit only, retain a configurable top pool, pick randomly.
// The exact ranking/randomization logic is a TBD hypothesis flagged for validation;
// the pool size is configurable (spec example value 10) and must not be treated as final.
export const surpriseMeStrategy: RecommendationStrategy = {
  id: "strategy_v1_surprise_me",
  select(candidates, context) {
    if (candidates.length === 0) {
      return { status: "no_candidates" };
    }
    if (context.mood !== "surprise_me") {
      throw new Error("surpriseMeStrategy requires mood === 'surprise_me'");
    }
    const poolSize = RECOMMENDATION_CONFIG.surprisePoolSize;
    if (poolSize === null) {
      return {
        status: "no_strong_match",
        reason: "Surprise Me pool size is not configured",
      };
    }
    const ranked = [...candidates].sort(
      (a, b) => b.situationScores[context.situation] - a.situationScores[context.situation]
    );
    const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const situationScore = winner.situationScores[context.situation];
    const distance = Math.pow(5 - situationScore, 2);
    return {
      status: "success",
      movie: winner,
      fit: {
        moodScore: null,
        situationScore,
        distance,
      },
    };
  },
};
