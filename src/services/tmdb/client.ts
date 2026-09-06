export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_TIMEOUT_MS = 15000;

export class TmdbConfigError extends Error {
  constructor(message = "TMDB_API_TOKEN is not set. Add it to .env (server-side only).") {
    super(message);
    this.name = "TmdbConfigError";
  }
}

export class TmdbApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string | null;

  constructor(status: number, statusText: string, body: string | null) {
    super(`TMDB request failed: ${status} ${statusText}`);
    this.name = "TmdbApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export class TmdbNetworkError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super(
      cause instanceof Error && cause.name === "TimeoutError"
        ? "TMDB request timed out"
        : "TMDB request failed: network error"
    );
    this.name = "TmdbNetworkError";
    this.cause = cause;
  }
}

export interface TmdbGetOptions {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export function readTmdbToken(): string {
  const token = process.env.TMDB_API_TOKEN;
  if (!token || token.trim().length === 0) {
    throw new TmdbConfigError();
  }
  return token.trim();
}

export function buildTmdbUrl(path: string, params: TmdbGetOptions["params"] = {}): string {
  // Leading-slash paths would reset the base URL's /3 segment, so strip it
  // and rely on the trailing slash of TMDB_BASE_URL.
  const url = new URL(path.replace(/^\//, ""), `${TMDB_BASE_URL}/`);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs.length > 0 ? `${url.toString()}?${qs}` : url.toString();
}

export async function tmdbGet<T>(path: string, options: TmdbGetOptions = {}): Promise<T> {
  const token = readTmdbToken();
  const url = buildTmdbUrl(path, options.params);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new TmdbNetworkError(error);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => null);
    throw new TmdbApiError(response.status, response.statusText, body);
  }
  return (await response.json()) as T;
}
