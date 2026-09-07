"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("switcher");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const isFa = currentLocale === "fa";
  const targetLocale = isFa ? "en" : "fa";
  const tooltipText = isFa ? t("switchToEn") : t("switchToFa");

  const toggleLocale = () => {
    router.replace(pathname, { locale: targetLocale });
  };

  return (
    <div className="fixed top-4 end-4 z-50 group">
      <button
        type="button"
        onClick={toggleLocale}
        aria-label={tooltipText}
        title={tooltipText}
        className="w-10 h-10 rounded-full bg-surface-raised/90 hover:bg-surface-raised border-2 border-line hover:border-line-hover shadow-md backdrop-blur-md flex items-center justify-center text-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true" className="select-none leading-none">
          {isFa ? "🇮🇷" : "🇬🇧"}
        </span>
      </button>

      {/* Floating tooltip on hover & focus */}
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full mt-2 end-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-100 group-focus-within:scale-100 px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-xs font-semibold text-ink shadow-lg whitespace-nowrap z-50"
      >
        {tooltipText}
      </div>
    </div>
  );
}
