export const TIME_SELECTIONS = ["under_90", "90_to_120", "over_120"] as const;
export type TimeSelection = (typeof TIME_SELECTIONS)[number];

export const STANDARD_MOODS = [
  "cozy_relax",
  "funny",
  "thrill_tense",
  "emotional",
  "thoughtful_mind_bending",
  "epic",
] as const;
export type StandardMood = (typeof STANDARD_MOODS)[number];

export const MOOD_SELECTIONS = [...STANDARD_MOODS, "surprise_me"] as const;
export type MoodSelection = (typeof MOOD_SELECTIONS)[number];

export const SITUATION_SELECTIONS = [
  "alone",
  "partner",
  "friends",
  "family",
  "kids",
] as const;
export type SituationSelection = (typeof SITUATION_SELECTIONS)[number];

export type MoodScoreMap = Readonly<Record<StandardMood, number>>;
export type SituationScoreMap = Readonly<Record<SituationSelection, number>>;

export interface MovieCandidate {
  readonly movieId: string;
  readonly title: string;
  readonly releaseYear: number | null;
  readonly runtimeMinutes: number;
  readonly genres: readonly string[];
  readonly moodScores: MoodScoreMap;
  readonly situationScores: SituationScoreMap;
}

export interface RecommendationContext {
  readonly time: TimeSelection;
  readonly mood: MoodSelection;
  readonly situation: SituationSelection;
}

export type RecommendationStatus =
  | "success"
  | "no_candidates"
  | "no_strong_match";

export interface SelectedFit {
  readonly moodScore: number | null;
  readonly situationScore: number;
  readonly distance: number;
}

export interface RecommendationResult {
  readonly status: RecommendationStatus;
  readonly movie?: MovieCandidate;
  readonly fit?: SelectedFit;
  readonly reason?: string;
}

export interface RecommendationStrategy {
  readonly id: string;
  select(
    candidates: readonly MovieCandidate[],
    context: RecommendationContext
  ): RecommendationResult;
}
