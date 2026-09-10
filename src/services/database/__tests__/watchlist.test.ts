import { Prisma } from "@prisma/client";
import { addToWatchlist, removeFromWatchlist, getWatchlist } from "../watchlist";

jest.mock("@/services/database/prisma", () => ({
  prisma: {
    movie: { findUnique: jest.fn() },
    watchlistItem: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    event: { create: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("@/services/database/prisma") as {
  prisma: {
    movie: { findUnique: jest.Mock };
    watchlistItem: { create: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock };
    event: { create: jest.Mock };
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("addToWatchlist", () => {
  it("creates the item and records watchlist_added on first save", async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: "m1" });
    prisma.watchlistItem.create.mockResolvedValue({ id: "w1" });

    const result = await addToWatchlist("user1", "m1");

    expect(result).toEqual({ ok: true, alreadySaved: false });
    expect(prisma.watchlistItem.create).toHaveBeenCalledWith({
      data: { anonymousUserId: "user1", movieId: "m1" },
    });
    expect(prisma.event.create).toHaveBeenCalledTimes(1);
    expect(prisma.event.create.mock.calls[0][0].data.eventType).toBe("watchlist_added");
    expect(prisma.event.create.mock.calls[0][0].data.movieId).toBe("m1");
  });

  it("treats a duplicate save as alreadySaved and does not record a second event", async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: "m1" });
    prisma.watchlistItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    const result = await addToWatchlist("user1", "m1");

    expect(result).toEqual({ ok: true, alreadySaved: true });
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it("rejects movies that do not exist without creating anything", async () => {
    prisma.movie.findUnique.mockResolvedValue(null);

    const result = await addToWatchlist("user1", "missing");

    expect(result).toEqual({ ok: false, reason: "movie_not_found" });
    expect(prisma.watchlistItem.create).not.toHaveBeenCalled();
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it("propagates unexpected database errors", async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: "m1" });
    prisma.watchlistItem.create.mockRejectedValue(new Error("connection lost"));

    await expect(addToWatchlist("user1", "m1")).rejects.toThrow("connection lost");
    expect(prisma.event.create).not.toHaveBeenCalled();
  });
});

describe("removeFromWatchlist", () => {
  it("deletes only the calling guest's item for the given movie", async () => {
    prisma.watchlistItem.deleteMany.mockResolvedValue({ count: 1 });

    const count = await removeFromWatchlist("user1", "m1");

    expect(count).toBe(1);
    expect(prisma.watchlistItem.deleteMany).toHaveBeenCalledWith({
      where: { anonymousUserId: "user1", movieId: "m1" },
    });
  });
});

describe("getWatchlist", () => {
  it("queries only the calling guest's items and maps movie payloads", async () => {
    prisma.watchlistItem.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-01-02T00:00:00Z"),
        movie: {
          id: "m2",
          title: "Movie Two",
          releaseYear: 2001,
          runtimeMinutes: 120,
          overview: "Overview",
          genres: ["Drama"],
          posterPath: "/two.jpg",
        },
      },
      {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        movie: {
          id: "m1",
          title: "Movie One",
          releaseYear: null,
          runtimeMinutes: 90,
          overview: null,
          genres: [],
          posterPath: null,
        },
      },
    ]);

    const items = await getWatchlist("user1");

    expect(prisma.watchlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { anonymousUserId: "user1" } })
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      movieId: "m2",
      title: "Movie Two",
      releaseYear: 2001,
      runtimeMinutes: 120,
      overview: "Overview",
      genres: ["Drama"],
      posterPath: "/two.jpg",
      savedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(items[1].posterPath).toBeNull();
    expect(items[1].overview).toBe("");
  });

  it("returns an empty list for a guest with no saved movies", async () => {
    prisma.watchlistItem.findMany.mockResolvedValue([]);
    expect(await getWatchlist("user2")).toEqual([]);
  });
});
