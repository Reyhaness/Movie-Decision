import {
  TIME_SELECTIONS,
  STANDARD_MOODS,
  SITUATION_SELECTIONS,
  type TimeSelection,
  type StandardMood,
  type SituationSelection,
} from "@/services/recommendation/types";

export interface RandomPreferences {
  time: TimeSelection;
  mood: StandardMood;
  situation: SituationSelection;
}

/**
 * Returns a randomly selected valid configuration of time, mood, and situation.
 * Accepts an optional randomFn (defaults to Math.random) for deterministic testing.
 */
export function getRandomPreferences(
  randomFn: () => number = Math.random
): RandomPreferences {
  const time = TIME_SELECTIONS[Math.floor(randomFn() * TIME_SELECTIONS.length)];
  const mood = STANDARD_MOODS[Math.floor(randomFn() * STANDARD_MOODS.length)];
  const situation = SITUATION_SELECTIONS[Math.floor(randomFn() * SITUATION_SELECTIONS.length)];

  return { time, mood, situation };
}
