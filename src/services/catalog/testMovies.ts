import type { MoodScoreMap, MovieCandidate, SituationScoreMap, StandardMood, SituationSelection } from "@/services/recommendation/types";

export const TEST_MOVIE_COUNT_MIN = 20;
export const TEST_MOVIE_COUNT_MAX = 30;

export const MOOD_RUBRIC: Record<StandardMood, [string, string]> = {
  cozy_relax: [
    "5 = strongly cozy, comforting, relaxing, low-stakes",
    "1 = very tense, disturbing or emotionally demanding",
  ],
  funny: [
    "5 = strongly comedy-driven / consistently funny",
    "1 = almost no humor",
  ],
  thrill_tense: [
    "5 = highly tense, thrilling or adrenaline-driven",
    "1 = calm, little tension",
  ],
  emotional: [
    "5 = deeply moving or emotionally intense",
    "1 = low emotional engagement",
  ],
  thoughtful_mind_bending: [
    "5 = highly cerebral, ambiguous or mind-bending",
    "1 = straightforward, low intellectual demand",
  ],
  epic: [
    "5 = grand, spectacular, immersive cinematic experience (scale, not length)",
    "1 = intimate / small-scale",
  ],
};

export const SITUATION_RUBRIC: Record<SituationSelection, [string, string]> = {
  alone: [
    "5 = highly rewarding solo viewing",
    "1 = awkward or unsatisfying alone",
  ],
  partner: [
    "5 = strongly suited to shared two-person viewing",
    "1 = poor fit for typical couple viewing",
  ],
  friends: [
    "5 = highly engaging/entertaining as a group",
    "1 = poor group viewing fit",
  ],
  family: [
    "5 = broadly appropriate for mixed-age family viewing",
    "1 = major content/awkwardness issues",
  ],
  kids: [
    "5 = genuinely appropriate for children",
    "1 = not appropriate for children",
  ],
};

const MOOD_KEYS: readonly StandardMood[] = [
  "cozy_relax",
  "funny",
  "thrill_tense",
  "emotional",
  "thoughtful_mind_bending",
  "epic",
];

const SITUATION_KEYS: readonly SituationSelection[] = [
  "alone",
  "partner",
  "friends",
  "family",
  "kids",
];

export { MOOD_KEYS, SITUATION_KEYS };

export interface TestMovieInput {
  slug: string;
  title: string;
  runtimeMinutes: number;
  releaseYear: number;
  genres?: string[];
  overview?: string;
  tmdbId?: number | null;
  moodScores: Record<StandardMood, number>;
  situationScores: Record<SituationSelection, number>;
}

export interface TestMovieIssue {
  slug: string;
  field: string;
  message: string;
}

export interface TestMovieValidation {
  movies: TestMovieInput[];
  issues: TestMovieIssue[];
  datasetWarning: TestMovieIssue | null;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENT_YEAR = new Date().getFullYear();

export function validateTestMovies(raw: readonly unknown[]): TestMovieValidation {
  const movies: TestMovieInput[] = [];
  const issues: TestMovieIssue[] = [];
  const seenSlugs = new Set<string>();

  raw.forEach((entry, index) => {
    const m = entry as Partial<TestMovieInput>;
    const slug = typeof m.slug === "string" ? m.slug : "";
    const label = slug || `entry #${index + 1}`;
    const addIssue = (field: string, message: string) =>
      issues.push({ slug: slug || label, field, message });

    if (typeof slug !== "string" || slug.length === 0) {
      addIssue("slug", `missing slug (entry #${index + 1})`);
    } else if (!SLUG_PATTERN.test(slug)) {
      addIssue("slug", "must be lowercase kebab-case (a-z, 0-9, dashes)");
    } else if (seenSlugs.has(slug)) {
      addIssue("slug", "duplicate slug");
    }
    if (slug) seenSlugs.add(slug);

    if (typeof m.title !== "string" || m.title.trim().length === 0) {
      addIssue("title", "required");
    }
    if (typeof m.runtimeMinutes !== "number" || !Number.isInteger(m.runtimeMinutes) || m.runtimeMinutes < 1 || m.runtimeMinutes > 600) {
      addIssue("runtimeMinutes", "required, integer between 1 and 600");
    }
    if (typeof m.releaseYear !== "number" || !Number.isInteger(m.releaseYear) || m.releaseYear < 1888 || m.releaseYear > CURRENT_YEAR + 2) {
      addIssue("releaseYear", `required, integer between 1888 and ${CURRENT_YEAR + 2}`);
    }
    if (m.tmdbId !== undefined && m.tmdbId !== null && (!Number.isInteger(m.tmdbId) || m.tmdbId <= 0)) {
      addIssue("tmdbId", "optional, must be a positive integer when provided");
    }
    if (m.genres !== undefined && (!Array.isArray(m.genres) || m.genres.some((g) => typeof g !== "string"))) {
      addIssue("genres", "optional, must be an array of strings");
    }

    if (!isScoreRecord(m.moodScores)) {
      addIssue("moodScores", "required object with all 6 mood scores");
    } else {
      for (const mood of MOOD_KEYS) {
        const problem = scoreProblem(m.moodScores[mood]);
        if (problem) addIssue(`moodScores.${mood}`, problem);
      }
    }
    if (!isScoreRecord(m.situationScores)) {
      addIssue("situationScores", "required object with all 5 situation scores");
    } else {
      for (const situation of SITUATION_KEYS) {
        const problem = scoreProblem(m.situationScores[situation]);
        if (problem) addIssue(`situationScores.${situation}`, problem);
      }
    }

    if (m.title && m.runtimeMinutes && m.releaseYear && isScoreRecord(m.moodScores) && isScoreRecord(m.situationScores)) {
      const complete =
        MOOD_KEYS.every((k) => !scoreProblem(m.moodScores![k])) &&
        SITUATION_KEYS.every((k) => !scoreProblem(m.situationScores![k]));
      if (complete) {
        movies.push(m as TestMovieInput);
      }
    }
  });

  const filled = raw.filter((entry) => {
    const m = entry as Partial<TestMovieInput>;
    return typeof m.title === "string" && m.title.trim().length > 0 && m.title !== "TODO";
  }).length;

  const datasetWarning: TestMovieIssue | null =
    filled > 0 && filled < TEST_MOVIE_COUNT_MIN
      ? {
          slug: "(dataset)",
          field: "count",
          message: `${filled} scored movie(s); test dataset targets ${TEST_MOVIE_COUNT_MIN}-${TEST_MOVIE_COUNT_MAX}`,
        }
      : null;

  return { movies, issues, datasetWarning };
}

function isScoreRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function scoreProblem(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return "required, integer";
  if (value === 0) return "not scored yet (0)";
  if (value < 1 || value > 5) return "must be between 1 and 5";
  return null;
}

export function toMovieCandidate(movie: TestMovieInput): MovieCandidate {
  const moodScores = {} as Record<StandardMood, number>;
  for (const mood of MOOD_KEYS) moodScores[mood] = movie.moodScores[mood];
  const situationScores = {} as Record<SituationSelection, number>;
  for (const situation of SITUATION_KEYS) situationScores[situation] = movie.situationScores[situation];
  return {
    movieId: movie.slug,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres ?? [],
    moodScores: moodScores as MoodScoreMap,
    situationScores: situationScores as SituationScoreMap,
  };
}
