"use client";

import { useTranslations } from "next-intl";

export function WatchlistButton({
  saved,
  disabled = false,
  onToggle,
  className = "",
}: {
  saved: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const t = useTranslations("watchlist");

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={saved ? t("removeFromWatchlist") : t("addToWatchlist")}
      title={saved ? t("removeFromWatchlist") : t("addToWatchlist")}
      className={`mda-focus inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 font-bold text-[11px] sm:text-xs cursor-pointer transition-[transform,border-color,background-color,color] duration-150 active:scale-95 disabled:opacity-60 ${
        saved
          ? "border-accent bg-accent text-accent-text shadow-[2px_2px_0px_0px_var(--color-line)]"
          : "border-line bg-surface text-ink shadow-[2px_2px_0px_0px_var(--color-line)] hover:bg-surface-raised"
      } ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5 shrink-0"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12v17l-6-4.5L6 21V4z" />
      </svg>
      <span className="whitespace-nowrap">
        {saved ? `✓ ${t("saved")}` : t("saveForLater")}
      </span>
    </button>
  );
}
