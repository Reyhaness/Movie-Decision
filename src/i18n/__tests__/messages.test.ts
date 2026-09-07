import fs from "fs";
import path from "path";
import {
  STANDARD_MOODS,
  SITUATION_SELECTIONS,
  TIME_SELECTIONS,
} from "@/services/recommendation/types";

function getFlattenedKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(getFlattenedKeys(v as Record<string, unknown>, nextKey));
    } else {
      keys.push(nextKey);
    }
  }
  return keys;
}

function getValueByPath(obj: Record<string, unknown>, keyPath: string): unknown {
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

describe("i18n messages parity and integrity", () => {
  const enPath = path.resolve(process.cwd(), "messages/en.json");
  const faPath = path.resolve(process.cwd(), "messages/fa.json");

  it("both en.json and fa.json exist and are valid JSON", () => {
    expect(fs.existsSync(enPath)).toBe(true);
    expect(fs.existsSync(faPath)).toBe(true);

    const enRaw = fs.readFileSync(enPath, "utf-8");
    const faRaw = fs.readFileSync(faPath, "utf-8");

    expect(() => JSON.parse(enRaw)).not.toThrow();
    expect(() => JSON.parse(faRaw)).not.toThrow();
  });

  const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));
  const fa = JSON.parse(fs.readFileSync(faPath, "utf-8"));
  const enKeys = getFlattenedKeys(en);
  const faKeys = getFlattenedKeys(fa);

  it("fa.json has exact key parity with en.json (no missing translations)", () => {
    const missingInFa = enKeys.filter((k) => !faKeys.includes(k));
    expect(missingInFa).toEqual([]);
  });

  it("en.json has exact key parity with fa.json (no extraneous translations)", () => {
    const extraInFa = faKeys.filter((k) => !enKeys.includes(k));
    expect(extraInFa).toEqual([]);
  });

  it("no translated values are empty strings or whitespace only", () => {
    for (const k of enKeys) {
      const enVal = getValueByPath(en, k);
      expect(typeof enVal).toBe("string");
      expect((enVal as string).trim().length).toBeGreaterThan(0);

      const faVal = getValueByPath(fa, k);
      expect(typeof faVal).toBe("string");
      expect((faVal as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("covers all recommendation time selections", () => {
    for (const t of TIME_SELECTIONS) {
      expect(en.time[t]).toBeDefined();
      expect(fa.time[t]).toBeDefined();
    }
  });

  it("covers all standard moods plus surprise_me labels and hints", () => {
    const allMoods = [...STANDARD_MOODS, "surprise_me"];
    for (const m of allMoods) {
      expect(en.mood.labels[m]).toBeDefined();
      expect(fa.mood.labels[m]).toBeDefined();
      expect(en.mood.hints[m]).toBeDefined();
      expect(fa.mood.hints[m]).toBeDefined();
    }
  });

  it("covers all situation selections", () => {
    for (const s of SITUATION_SELECTIONS) {
      expect(en.situation[s]).toBeDefined();
      expect(fa.situation[s]).toBeDefined();
    }
  });

  it("has switcher labels for both en and fa with emoji flags and short labels", () => {
    expect(en.switcher.en).toContain("🇬🇧");
    expect(en.switcher.en).toContain("EN");
    expect(en.switcher.fa).toContain("🇮🇷");
    expect(en.switcher.fa).toContain("فا");
    expect(fa.switcher.en).toContain("🇬🇧");
    expect(fa.switcher.en).toContain("EN");
    expect(fa.switcher.fa).toContain("🇮🇷");
    expect(fa.switcher.fa).toContain("فا");
  });
});
