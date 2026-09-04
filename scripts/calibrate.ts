import {
  validateTestMovies,
  toMovieCandidate,
  SITUATION_KEYS,
} from "../src/services/catalog/testMovies";
import { recommendMovie, filterByTime } from "../src/services/recommendation";
import type { MovieCandidate } from "../src/services/recommendation";
import { TIME_SELECTIONS, STANDARD_MOODS } from "../src/services/recommendation/types";
import type { StandardMood, SituationSelection, TimeSelection } from "../src/services/recommendation/types";
import { testMovies } from "../prisma/seed-data/test-movies";

interface Attempt {
  moodScore: number;
  situationScore: number;
  distance: number;
}

interface CellReport {
  time: TimeSelection;
  mood: StandardMood;
  situation: SituationSelection;
  candidateCount: number;
  resultStatus: string;
  selectedMovie: string | null;
  distance: number | null;
  attempts: Attempt[];
}

const SEPARATOR = "=".repeat(72);

function loadCandidates(): MovieCandidate[] {
  const { movies, issues, datasetWarning } = validateTestMovies(testMovies);
  if (issues.length > 0) {
    console.error(`[calibrate] Dataset has ${issues.length} validation issue(s). Fix these first:`);
    for (const issue of issues) {
      console.error(`  [${issue.slug}] ${issue.field}: ${issue.message}`);
    }
    process.exit(1);
  }
  if (datasetWarning) {
    console.warn(`[calibrate] WARNING: ${datasetWarning.message} (continuing with a reduced dataset)`);
  }
  return movies.map(toMovieCandidate);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return Number.NaN;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function reportDistanceDistribution(attempts: Attempt[], label: string): void {
  const distances = attempts.map((a) => a.distance).sort((a, b) => a - b);
  if (distances.length === 0) {
    console.log(`\n${label}: no data`);
    return;
  }
  const pct = (p: number) => percentile(distances, p);
  console.log(`\n${label}`);
  console.log(
    `  n=${distances.length}  min=${distances[0]}  p25=${pct(25)}  median=${pct(50)}  p75=${pct(75)}  max=${distances[distances.length - 1]}`
  );
  const hist = new Map<number, number>();
  for (const d of distances) hist.set(d, (hist.get(d) ?? 0) + 1);
  const maxCount = Math.max(...hist.values());
  for (const [d, count] of [...hist.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = "#".repeat(Math.ceil((count / maxCount) * 40));
    console.log(`  d=${String(d).padStart(2)} n=${String(count).padStart(4)}  ${bar}`);
  }
}

function run(): void {
  const candidates = loadCandidates();
  console.log(`Calibration report - ${candidates.length} candidates, Strategy V1 (threshold: unset/TBD)`);
  console.log(SEPARATOR);

  const cellReports: CellReport[] = [];

  for (const time of TIME_SELECTIONS) {
    const timeFiltered = filterByTime(candidates, time);
    for (const mood of STANDARD_MOODS) {
      for (const situation of SITUATION_KEYS) {
        const attempts: Attempt[] = timeFiltered.map((c) => {
          const moodScore = c.moodScores[mood];
          const situationScore = c.situationScores[situation];
          return {
            moodScore,
            situationScore,
            distance: (5 - moodScore) ** 2 + (5 - situationScore) ** 2,
          };
        });
        const result = recommendMovie({
          input: { time, mood, situation },
          candidates,
        });
        cellReports.push({
          time,
          mood,
          situation,
          candidateCount: timeFiltered.length,
          resultStatus: result.status,
          selectedMovie: result.movie?.title ?? null,
          distance: result.fit?.distance ?? null,
          attempts,
        });
      }
    }
  }

  const allAttempts = cellReports.flatMap((c) => c.attempts);
  reportDistanceDistribution(allAttempts, "OVERALL distance distribution (all standard cells)");

  for (const mood of STANDARD_MOODS) {
    reportDistanceDistribution(
      cellReports.filter((c) => c.mood === mood).flatMap((c) => c.attempts),
      `MOOD ${mood} (${TIME_SELECTIONS.length * SITUATION_KEYS.length} cells)`
    );
  }

  for (const situation of SITUATION_KEYS) {
    reportDistanceDistribution(
      cellReports.filter((c) => c.situation === situation).flatMap((c) => c.attempts),
      `SITUATION ${situation} (${TIME_SELECTIONS.length * STANDARD_MOODS.length} cells)`
    );
  }

  console.log("\nPer-cell outcomes (Strategy V1 selection):");
  for (const cell of cellReports) {
    const fitText = cell.distance === null ? "-" : `d=${cell.distance}`;
    console.log(
      `  ${cell.time.padEnd(10)} ${cell.mood.padEnd(24)} ${cell.situation.padEnd(8)} n=${String(cell.candidateCount).padEnd(3)} ${cell.resultStatus.padEnd(12)} ${String(cell.selectedMovie ?? "-").padEnd(34)} ${fitText}`
    );
  }

  const emptyCells = cellReports.filter((c) => c.candidateCount === 0);
  console.log("\nCoverage notes:");
  if (emptyCells.length > 0) {
    console.log(`  - ${emptyCells.length} cell(s) have NO candidates after the time filter:`);
    for (const cell of emptyCells) {
      console.log(`      ${cell.time} x ${cell.mood} x ${cell.situation}`);
    }
  } else {
    console.log("  - Every time bucket has candidates for every mood x situation.");
  }
  console.log("  - Surprise Me cells are excluded from distance stats (its strategy logic is TBD).");
  console.log("  - MIN_RECOMMENDATION_FIT remains unset/TBD; the engine applies no threshold.");
  console.log("  - Use the distributions above to choose the threshold with the Product Designer.");
}

run();
