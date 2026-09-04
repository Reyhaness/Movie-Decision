import type {
  MovieCandidate,
  RecommendationContext,
  RecommendationStrategy,
} from "./types";
import { calculateDistance } from "./filters";
import { RECOMMENDATION_CONFIG } from "@/lib/constants";

export function scoreAndRank(
  candidates: readonly MovieCandidate[],
  context: RecommendationContext
): Array<{ candidate: MovieCandidate; distance: number; moodScore: number; situationScore: number }> {
  const { mood, situation } = context;
  if (mood === "surprise_me") {
    throw new Error("surprise_me must use the Surprise Me strategy, not the standard strategy");
  }
  return candidates
    .map((candidate) => {
      const moodScore = candidate.moodScores[mood];
      const situationScore = candidate.situationScores[situation];
      return { candidate, distance: calculateDistance(moodScore, situationScore), moodScore, situationScore };
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.moodScore !== b.moodScore) return b.moodScore - a.moodScore;
      if (a.situationScore !== b.situationScore) return b.situationScore - a.situationScore;
      return 0;
    });
}

// Strategy V1 per RECOMMENDATION_SPEC.md §7-9: squared distance from ideal fit,
// tie-breaks by mood score, then situation score, then random among remaining ties.
// The threshold below is TBD and must be calibrated; when unset, no threshold is applied.
export const standardStrategy: RecommendationStrategy = {
  id: "strategy_v1_standard",
  select(candidates, context) {
    if (candidates.length === 0) {
      return { status: "no_candidates" };
    }
    const ranked = scoreAndRank(candidates, context);
    const threshold = RECOMMENDATION_CONFIG.minAllowedDistance;
    if (threshold !== null && ranked[0].distance > threshold) {
      return {
        status: "no_strong_match",
        reason: "No candidate meets the minimum contextual fit threshold",
      };
    }
    const best = ranked[0];
    // Random applies only to candidates still tied after tie-breakers 1-3
    // (distance, mood score, situation score) per RECOMMENDATION_SPEC.md §9.
    const tieGroup = ranked.filter(
      (r) => r.distance === best.distance && r.moodScore === best.moodScore && r.situationScore === best.situationScore
    );
    const winner = tieGroup.length > 1 ? tieGroup[Math.floor(Math.random() * tieGroup.length)] : best;
    return {
      status: "success",
      movie: winner.candidate,
      fit: {
        moodScore: winner.moodScore,
        situationScore: winner.situationScore,
        distance: winner.distance,
      },
    };
  },
};
