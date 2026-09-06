export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string | null;
  runtime: number | null;
  genres: TmdbGenre[];
  poster_path: string | null;
  backdrop_path: string | null;
  imdb_id: string | null;
}

export interface TmdbSearchMovieResult {
  id: number;
  title: string;
  original_title?: string;
  release_date: string | null;
  overview: string;
  poster_path: string | null;
}

export interface TmdbSearchMoviesResponse {
  page: number;
  results: TmdbSearchMovieResult[];
  total_pages: number;
  total_results: number;
}
