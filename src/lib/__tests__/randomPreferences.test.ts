import { getRandomPreferences } from "../randomPreferences";
import {
  TIME_SELECTIONS,
  STANDARD_MOODS,
  SITUATION_SELECTIONS,
} from "@/services/recommendation/types";

describe("getRandomPreferences", () => {
  it("returns valid preferences with default Math.random", () => {
    for (let i = 0; i < 20; i++) {
      const prefs = getRandomPreferences();
      expect(TIME_SELECTIONS).toContain(prefs.time);
      expect(STANDARD_MOODS).toContain(prefs.mood);
      expect(SITUATION_SELECTIONS).toContain(prefs.situation);
      // Ensure surprise_me is NOT returned as mood
      expect(prefs.mood).not.toBe("surprise_me");
    }
  });

  it("is deterministic with a mock random function", () => {
    // Sequence returns 0, 0.5, 0.999
    let callCount = 0;
    const mockRandom = () => {
      callCount++;
      if (callCount % 3 === 1) return 0; // index 0
      if (callCount % 3 === 2) return 0.5; // middle index
      return 0.99; // last index
    };

    const result = getRandomPreferences(mockRandom);
    expect(result.time).toBe(TIME_SELECTIONS[0]); // under_90
    expect(result.mood).toBe(STANDARD_MOODS[Math.floor(0.5 * STANDARD_MOODS.length)]);
    expect(result.situation).toBe(SITUATION_SELECTIONS[SITUATION_SELECTIONS.length - 1]);
  });

  it("covers all choices across multiple iterations", () => {
    const timesSeen = new Set<string>();
    const moodsSeen = new Set<string>();
    const situationsSeen = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const { time, mood, situation } = getRandomPreferences();
      timesSeen.add(time);
      moodsSeen.add(mood);
      situationsSeen.add(situation);
    }

    expect(timesSeen.size).toBe(TIME_SELECTIONS.length);
    expect(moodsSeen.size).toBe(STANDARD_MOODS.length);
    expect(situationsSeen.size).toBe(SITUATION_SELECTIONS.length);
  });
});
