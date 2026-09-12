"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function WatchlistNav() {
  const t = useTranslations("watchlist");
  const pathname = usePathname();
  const active = pathname === "/watchlist";

  return (
    <Link
      href="/watchlist"
      aria-label={t("navLabel")}
      aria-current={active ? "page" : undefined}
      title={t("navLabel")}
      className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-full border-2 shadow-sm sm:shadow-md flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-[transform,border-color,background-color,color,box-shadow] duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        active
          ? "border-accent bg-accent text-accent-text"
          : "border-line bg-surface-raised hover:bg-surface-raised text-ink"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="w-4 h-4 shrink-0"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12v17l-6-4.5L6 21V4z" />
      </svg>
      <span className="whitespace-nowrap leading-none">{t("navLabel")}</span>
    </Link>
  );
}
