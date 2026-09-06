import { fetchMovieDetails } from "../src/services/tmdb";

const TEST_MOVIE_ID = 550; // Fight Club - stable, well-known TMDB id

async function main() {
  if (!process.env.TMDB_API_TOKEN) {
    console.error("TMDB_API_TOKEN is not set. Add it to .env, then run: npm run tmdb:smoke");
    process.exit(1);
  }
  console.log(`GET /movie/${TEST_MOVIE_ID} ...`);
  const movie = await fetchMovieDetails(TEST_MOVIE_ID);
  console.log("OK");
  console.log(`  id:       ${movie.id}`);
  console.log(`  title:    ${movie.title}`);
  console.log(`  year:     ${movie.release_date?.slice(0, 4) ?? "n/a"}`);
  console.log(`  runtime:  ${movie.runtime ?? "n/a"} min`);
  console.log(`  genres:   ${movie.genres.map((g) => g.name).join(", ")}`);
  console.log(`  poster:   ${movie.poster_path ?? "n/a"}`);
}

main().catch((error) => {
  console.error(`SMOKE FAILED: ${error.name}: ${error.message}`);
  if (error instanceof Error && "status" in error) {
    console.error(`  HTTP status: ${(error as { status: number }).status}`);
  }
  process.exit(1);
});
