import { getMovieOverview, getMovieTitle } from "../movieTranslations";

describe("movieTranslations", () => {
  const sampleMovie = {
    movieId: "chef",
    title: "Chef",
    overview: "A head chef quits his restaurant job and buys a food truck.",
  };

  it("returns English overview when locale is 'en'", () => {
    const overview = getMovieOverview(sampleMovie, "en");
    expect(overview).toBe(sampleMovie.overview);
  });

  it("returns Persian overview when locale is 'fa' and translation exists", () => {
    const overview = getMovieOverview(sampleMovie, "fa");
    expect(overview).toContain("سرآشپز");
  });

  it("falls back to English overview when translation is missing", () => {
    const unknownMovie = {
      movieId: "non-existent-movie-123",
      title: "Non Existent Movie",
      overview: "Original english synopsis.",
    };
    const overview = getMovieOverview(unknownMovie, "fa");
    expect(overview).toBe("Original english synopsis.");
  });

  it("handles lookup by title if movieId does not match", () => {
    const movieWithOnlyTitle = {
      title: "Knives Out",
      overview: "A detective investigates the death of a patriarch.",
    };
    const overview = getMovieOverview(movieWithOnlyTitle, "fa");
    expect(overview).toBeTruthy();
    expect(overview).not.toBe(movieWithOnlyTitle.overview);
  });

  it("returns English primaryTitle when locale is 'en'", () => {
    const res = getMovieTitle({ movieId: "hot-fuzz", title: "Hot Fuzz" }, "en");
    expect(res.primaryTitle).toBe("Hot Fuzz");
    expect(res.originalTitle).toBeUndefined();
  });

  it("returns Persian primaryTitle and originalTitle when locale is 'fa'", () => {
    const res = getMovieTitle({ movieId: "hot-fuzz", title: "Hot Fuzz" }, "fa");
    expect(res.primaryTitle).toContain("پلیس خفن");
    expect(res.originalTitle).toBe("Hot Fuzz");
  });

  it("falls back to English title if no Persian title mapping is found", () => {
    const res = getMovieTitle({ movieId: "unknown-movie-999", title: "Unknown Title" }, "fa");
    expect(res.primaryTitle).toBe("Unknown Title");
    expect(res.originalTitle).toBeUndefined();
  });
});
