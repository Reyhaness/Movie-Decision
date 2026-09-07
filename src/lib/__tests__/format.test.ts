import { toPersianDigits, formatLocalizedNumber } from "../format";

describe("format utilities", () => {
  describe("toPersianDigits", () => {
    it("converts Western Arabic digits to Persian digits", () => {
      expect(toPersianDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
      expect(toPersianDigits(2014)).toBe("۲۰۱۴");
      expect(toPersianDigits(114)).toBe("۱۱۴");
    });

    it("handles mixed strings preserving non-digits", () => {
      expect(toPersianDigits("Year 2024 - 120 min")).toBe("Year ۲۰۲۴ - ۱۲۰ min");
    });

    it("handles null and undefined gracefully", () => {
      expect(toPersianDigits(null)).toBe("");
      expect(toPersianDigits(undefined)).toBe("");
    });
  });

  describe("formatLocalizedNumber", () => {
    it("returns Persian digits when locale is 'fa'", () => {
      expect(formatLocalizedNumber(2014, "fa")).toBe("۲۰۱۴");
      expect(formatLocalizedNumber(95, "fa")).toBe("۹۵");
      expect(formatLocalizedNumber("2023", "fa")).toBe("۲۰۲۳");
    });

    it("returns standard digits when locale is 'en'", () => {
      expect(formatLocalizedNumber(2014, "en")).toBe("2014");
      expect(formatLocalizedNumber(95, "en")).toBe("95");
      expect(formatLocalizedNumber("2023", "en")).toBe("2023");
    });

    it("returns empty string for null or undefined", () => {
      expect(formatLocalizedNumber(null, "fa")).toBe("");
      expect(formatLocalizedNumber(undefined, "en")).toBe("");
    });
  });
});
