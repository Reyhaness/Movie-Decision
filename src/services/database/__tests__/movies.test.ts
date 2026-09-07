import { loadMoviePayload } from "../movies";
import { prisma } from "../prisma";

jest.mock("../prisma", () => ({
  prisma: {
    movie: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("loadMoviePayload", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns posterPath from the database when present", async () => {
    (prisma.movie.findUnique as jest.Mock).mockResolvedValue({
      id: "cm123",
      slug: "paddington-2",
      title: "Paddington 2",
      releaseYear: 2017,
      runtimeMinutes: 103,
      overview: "Paddington tries to find a present.",
      genres: ["Adventure", "Comedy"],
      posterPath: "/kknSS318uQf9zD5J5V1z525P03t.jpg",
    });

    const payload = await loadMoviePayload("cm123");
    expect(payload).not.toBeNull();
    expect(payload?.posterPath).toBe("/kknSS318uQf9zD5J5V1z525P03t.jpg");
  });

  it("falls back to tmdb-matches.json posterPath when DB movie has null posterPath", async () => {
    (prisma.movie.findUnique as jest.Mock).mockResolvedValue({
      id: "cm123",
      slug: "paddington-2",
      title: "Paddington 2",
      releaseYear: 2017,
      runtimeMinutes: 103,
      overview: "Paddington tries to find a present.",
      genres: ["Adventure", "Comedy"],
      posterPath: null,
    });

    const payload = await loadMoviePayload("cm123");
    expect(payload).not.toBeNull();
    expect(payload?.posterPath).toBeDefined();
  });

  it("falls back to looking up by slug when ID lookup returns null", async () => {
    (prisma.movie.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "cm456",
        slug: "superbad",
        title: "Superbad",
        releaseYear: 2007,
        runtimeMinutes: 113,
        overview: "High school comedy.",
        genres: ["Comedy"],
        posterPath: "/ek8e8txUyUwd2BNqj6lFEerJ9eb.jpg",
      });

    const payload = await loadMoviePayload("superbad");
    expect(payload).not.toBeNull();
    expect(payload?.title).toBe("Superbad");
    expect(payload?.posterPath).toBe("/ek8e8txUyUwd2BNqj6lFEerJ9eb.jpg");
  });

  it("returns null when movie is neither in DB nor in in-memory catalog", async () => {
    (prisma.movie.findUnique as jest.Mock).mockResolvedValue(null);

    const payload = await loadMoviePayload("non-existent-movie-slug");
    expect(payload).toBeNull();
  });
});

describe("loadActiveCandidates", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads active candidates from the database and maps scores properly", async () => {
    (prisma.movie.findMany as jest.Mock).mockResolvedValue([
      {
        id: "db-id-1",
        slug: "test-movie",
        title: "Test Movie",
        runtimeMinutes: 100,
        releaseYear: 2020,
        genres: ["Action"],
        overview: "A test action movie.",
        tmdbId: 9999,
        moodScores: [
          { mood: "cozy_relax", score: 4 },
          { mood: "funny", score: 3 },
          { mood: "thrill_tense", score: 5 },
          { mood: "emotional", score: 2 },
          { mood: "thoughtful_mind_bending", score: 4 },
          { mood: "epic", score: 5 },
        ],
        situationScores: [
          { situation: "alone", score: 5 },
          { situation: "partner", score: 4 },
          { situation: "friends", score: 5 },
          { situation: "family", score: 3 },
          { situation: "kids", score: 1 },
        ],
      },
    ]);

    const candidates = await (await import("../movies")).loadActiveCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0].movieId).toBe("db-id-1");
    expect(candidates[0].title).toBe("Test Movie");
    expect(candidates[0].moodScores.thrill_tense).toBe(5);
    expect(candidates[0].situationScores.alone).toBe(5);
  });

  it("falls back to in-memory testMovies when the database throws an error", async () => {
    (prisma.movie.findMany as jest.Mock).mockRejectedValue(new Error("DB offline"));

    const candidates = await (await import("../movies")).loadActiveCandidates();
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].movieId).toBe("paddington-2");
  });

  it("falls back to in-memory testMovies in loadMoviePayload when DB throws", async () => {
    (prisma.movie.findUnique as jest.Mock).mockRejectedValue(new Error("DB offline"));

    const payload = await loadMoviePayload("paddington-2");
    expect(payload).not.toBeNull();
    expect(payload?.title).toBe("Paddington 2");
    expect(payload?.posterPath).toBeDefined();
  });
});
