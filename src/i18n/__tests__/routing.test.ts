jest.mock("next-intl/routing", () => ({
  defineRouting: jest.fn((config) => config),
}));

jest.mock("next-intl/navigation", () => ({
  createNavigation: jest.fn(() => ({
    Link: jest.fn(),
    redirect: jest.fn(),
    usePathname: jest.fn(),
    useRouter: jest.fn(),
    getPathname: jest.fn(),
  })),
}));

import { routing } from "../routing";

describe("i18n routing configuration", () => {
  it("defines english and persian as supported locales", () => {
    expect(routing.locales).toEqual(["en", "fa"]);
  });

  it("sets english as default locale", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("uses always prefix for deterministic localized URLs", () => {
    expect(routing.localePrefix).toBe("always");
  });
});
