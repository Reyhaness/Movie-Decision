import { buildTmdbUrl, readTmdbToken, tmdbGet, TmdbApiError, TmdbConfigError, TmdbNetworkError } from "../client";

const ORIGINAL_FETCH = global.fetch;

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
  delete process.env.TMDB_API_TOKEN;
});

describe("readTmdbToken", () => {
  it("throws TmdbConfigError when the token is missing", () => {
    expect(() => readTmdbToken()).toThrow(TmdbConfigError);
  });

  it("accepts and trims a present token", () => {
    process.env.TMDB_API_TOKEN = "  secret-token  ";
    expect(readTmdbToken()).toBe("secret-token");
  });
});

describe("buildTmdbUrl", () => {
  it("builds base url without params", () => {
    expect(buildTmdbUrl("/movie/550")).toBe("https://api.themoviedb.org/3/movie/550");
  });

  it("serializes params and skips undefined", () => {
    expect(buildTmdbUrl("/search/movie", { query: "the matrix", page: 1, year: undefined })).toBe(
      "https://api.themoviedb.org/3/search/movie?query=the+matrix&page=1"
    );
  });
});

describe("tmdbGet", () => {
  it("sends Bearer auth and parses JSON on success", async () => {
    process.env.TMDB_API_TOKEN = "test-token";
    const mockJson = { id: 550, title: "Fight Club" };
    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(mockJson), { status: 200, headers: { "content-type": "application/json" } })
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await tmdbGet<{ id: number; title: string }>("/movie/550");

    expect(result).toEqual(mockJson);
    const [url, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.themoviedb.org/3/movie/550");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-token", accept: "application/json" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("throws TmdbConfigError before any request when token is missing", async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    await expect(tmdbGet("/movie/550")).rejects.toThrow(TmdbConfigError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws TmdbApiError with status and body on non-2xx", async () => {
    process.env.TMDB_API_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue(
      new Response('{"status_message":"The resource you requested could not be found."}', {
        status: 404,
        statusText: "Not Found",
      })
    ) as unknown as typeof fetch;

    const error: unknown = await tmdbGet("/movie/999999999").catch((e) => e);
    const apiError = error as TmdbApiError;
    expect(apiError).toBeInstanceOf(TmdbApiError);
    expect(apiError.status).toBe(404);
    expect(apiError.statusText).toBe("Not Found");
    expect(apiError.body).toContain("could not be found");
  });

  it("wraps network failures in TmdbNetworkError", async () => {
    process.env.TMDB_API_TOKEN = "test-token";
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch;
    await expect(tmdbGet("/movie/550")).rejects.toThrow(TmdbNetworkError);
  });
});
