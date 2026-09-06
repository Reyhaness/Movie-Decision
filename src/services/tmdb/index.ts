import { tmdbGet } from "./client";
import type { TmdbMovieDetails, TmdbSearchMoviesResponse } from "./types";

export async function fetchMovieDetails(movieId: number | string): Promise<TmdbMovieDetails> {
  return tmdbGet<TmdbMovieDetails>(`/movie/${movieId}`);
}

export interface SearchMoviesOptions {
  page?: number;
  year?: number;
}

export async function searchMovies(
  query: string,
  options: SearchMoviesOptions = {}
): Promise<TmdbSearchMoviesResponse> {
  return tmdbGet<TmdbSearchMoviesResponse>("/search/movie", {
    params: { query, page: options.page, year: options.year },
  });
}

export * from "./client";
export * from "./types";
