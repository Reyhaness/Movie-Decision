"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("switcher");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: "en" | "fa") => {
    if (newLocale === currentLocale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="fixed top-4 end-4 z-50 flex items-center p-1 rounded-2xl bg-surface/85 backdrop-blur-md border-2 border-line shadow-md"
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        aria-pressed={currentLocale === "en"}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          currentLocale === "en"
            ? "bg-accent text-accent-text shadow-sm"
            : "text-muted hover:text-ink"
        }`}
      >
        <span>🇬🇧</span>
        <span>English</span>
      </button>
      <button
        type="button"
        onClick={() => switchLocale("fa")}
        aria-pressed={currentLocale === "fa"}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          currentLocale === "fa"
            ? "bg-accent text-accent-text shadow-sm"
            : "text-muted hover:text-ink"
        }`}
      >
        <span>🇮🇷</span>
        <span>فارسی</span>
      </button>
    </div>
  );
}
