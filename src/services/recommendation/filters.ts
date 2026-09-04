import type {
  MoodScoreMap,
  MovieCandidate,
  SituationScoreMap,
  StandardMood,
  SituationSelection,
  TimeSelection,
} from "./types";

export function filterByTime(
  candidates: readonly MovieCandidate[],
  time: TimeSelection
): MovieCandidate[] {
  return candidates.filter((c) => {
    const r = c.runtimeMinutes;
    if (time === "under_90") return r < 90;
    if (time === "over_120") return r >= 120;
    return r >= 90 && r <= 120;
  });
}

export function getMoodScore(
  candidate: MovieCandidate,
  mood: StandardMood
): number {
  return candidate.moodScores[mood];
}

export function getSituationScore(
  candidate: MovieCandidate,
  situation: SituationSelection
): number {
  return candidate.situationScores[situation];
}

export function calculateDistance(
  moodScore: number,
  situationScore: number
): number {
  return Math.pow(5 - moodScore, 2) + Math.pow(5 - situationScore, 2);
}

export function buildCandidate(
  partial: {
    movieId: string;
    title: string;
    runtimeMinutes: number;
    releaseYear?: number | null;
    genres?: readonly string[];
    moodScores?: Partial<Record<StandardMood, number>>;
    situationScores?: Partial<Record<SituationSelection, number>>;
  }
): MovieCandidate {
  const moodScores: MoodScoreMap = {
    cozy_relax: 3,
    funny: 3,
    thrill_tense: 3,
    emotional: 3,
    thoughtful_mind_bending: 3,
    epic: 3,
  };
  const situationScores: SituationScoreMap = {
    alone: 3,
    partner: 3,
    friends: 3,
    family: 3,
    kids: 3,
  };
  if (partial.moodScores) Object.assign(moodScores, partial.moodScores);
  if (partial.situationScores) Object.assign(situationScores, partial.situationScores);
  return {
    movieId: partial.movieId,
    title: partial.title,
    releaseYear: partial.releaseYear ?? null,
    runtimeMinutes: partial.runtimeMinutes,
    genres: partial.genres ?? [],
    moodScores,
    situationScores,
  };
}
