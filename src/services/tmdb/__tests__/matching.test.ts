import {
  chooseBestMatch,
  demoteIfRuntimeMismatch,
  extractYear,
  normalizeTitle,
  runtimeVerifies,
  scoreTitleMatch,
} from "../matching";
import type { TmdbSearchMovieResult } from "../types";

const result = (id: number, title: string, releaseDate: string, originalTitle?: string): TmdbSearchMovieResult => ({
  id,
  title,
  release_date: releaseDate,
  overview: "",
  poster_path: null,
  ...(originalTitle !== undefined ? { original_title: originalTitle } : {}),
});

describe("normalizeTitle", () => {
  it("lowercases, strips punctuation and leading articles", () => {
    expect(normalizeTitle("The Shawshank Redemption")).toBe("shawshank redemption");
    expect(normalizeTitle("A Quiet Place!")).toBe("quiet place");
    expect(normalizeTitle("Léon: The Professional")).toBe("leon the professional");
  });
});

describe("scoreTitleMatch", () => {
  it("scores exact normalized titles highest", () => {
    expect(scoreTitleMatch("The Dark Knight", "the dark knight")).toBe(6);
  });

  it("scores prefix/contains matches progressively lower", () => {
    expect(scoreTitleMatch("Her", "Her <extended cut>")).toBe(4);
    expect(scoreTitleMatch("Up", "Star Wars: Up Rising")).toBe(3);
    expect(scoreTitleMatch("Alien", "Predator")).toBe(0);
  });

  it("matches via original title", () => {
    expect(scoreTitleMatch("Spirited Away", "Sen to Chihiro no Kamikakushi")).toBe(0);
  });
});

describe("extractYear", () => {
  it("parses the year and tolerates null", () => {
    expect(extractYear("1999-12-31")).toBe(1999);
    expect(extractYear(null)).toBeNull();
  });
});

describe("chooseBestMatch", () => {
  it("returns exact for clear title+year winner", () => {
    const decision = chooseBestMatch({ title: "arrival", releaseYear: 2016 }, [result(329865, "Arrival", "2016-11-10")]);
    expect(decision.confidence).toBe("exact");
    expect(decision.best?.tmdbId).toBe(329865);
  });

  it("prefers exact title+year over later strong candidate", () => {
    const decision = chooseBestMatch({ title: "the thing", releaseYear: 1982 }, [
      result(20533, "The Thing", "1982-06-25"),
      result(11036, "The Thing", "2011-10-12"),
    ]);
    expect(decision.confidence).toBe("exact");
    expect(decision.best?.tmdbId).toBe(20533);
  });

  it("flags ambiguous when title matches but years conflict and no clear winner", () => {
    const decision = chooseBestMatch({ title: "the thing", releaseYear: 1982 }, [
      result(20533, "The Thing", "2011-10-12"),
      result(11036, "The Thing", "2011-10-12"),
    ]);
    expect(decision.confidence).toBe("ambiguous");
    expect(decision.best).toBeNull();
  });

  it("returns likely for exact title but year outside tolerance", () => {
    const decision = chooseBestMatch({ title: "the thing", releaseYear: 1982 }, [
      result(20533, "The Thing", "2011-10-12"),
    ]);
    expect(decision.confidence).toBe("likely");
    expect(decision.best?.tmdbId).toBe(20533);
  });

  it("returns missing when no candidate reaches the viable score", () => {
    const decision = chooseBestMatch({ title: "nosuchmovie", releaseYear: 2020 }, [result(1, "Predator", "1987-06-12")]);
    expect(decision.confidence).toBe("missing");
    expect(decision.best).toBeNull();
  });

  it("returns missing on empty results", () => {
    expect(chooseBestMatch({ title: "anything", releaseYear: 2000 }, []).confidence).toBe("missing");
  });
});

describe("runtime verification", () => {
  it("accepts runtime within tolerance", () => {
    expect(runtimeVerifies(101, 103)).toBe(true);
  });

  it("rejects runtime beyond tolerance", () => {
    expect(runtimeVerifies(101, 115)).toBe(false);
  });

  it("rejects null runtime", () => {
    expect(runtimeVerifies(101, null)).toBe(false);
  });
});

describe("demoteIfRuntimeMismatch", () => {
  it("keeps exact when verified", () => {
    const d = chooseBestMatch({ title: "arrival", releaseYear: 2016 }, [result(329865, "Arrival", "2016-11-10")]);
    expect(demoteIfRuntimeMismatch(d, true).confidence).toBe("exact");
  });

  it("demotes exact to likely on mismatch", () => {
    const d = chooseBestMatch({ title: "arrival", releaseYear: 2016 }, [result(329865, "Arrival", "2016-11-10")]);
    expect(demoteIfRuntimeMismatch(d, false).confidence).toBe("likely");
  });

  it("demotes likely to ambiguous on mismatch", () => {
    const candidate = {
      tmdbId: 1,
      title: "Arrival",
      originalTitle: null,
      releaseYear: 2015,
      score: 3,
    };
    const d = {
      best: candidate,
      confidence: "likely" as const,
      candidates: [candidate],
    };
    expect(demoteIfRuntimeMismatch(d, false).confidence).toBe("ambiguous");
  });

  it("leaves decision untouched when best is null", () => {
    const d = {
      best: null,
      confidence: "missing" as const,
      candidates: [],
    };
    expect(demoteIfRuntimeMismatch(d, false).confidence).toBe("missing");
  });
});
