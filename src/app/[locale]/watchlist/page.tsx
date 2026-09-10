"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MoviePoster, SecondaryButton, TicketPerforation } from "@/components/ui";
import { formatLocalizedNumber } from "@/lib/format";
import { getMovieOverview, getMovieTitle } from "@/lib/movieTranslations";
import type { WatchlistEntry } from "@/services/database/watchlist";

type WatchlistPageState = "loading" | "ready" | "error";

export default function WatchlistPage() {
  const locale = useLocale();
  const t = useTranslations("watchlist");
  const tGenres = useTranslations("genres");

  const [state, setState] = useState<WatchlistPageState>("loading");
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [removingMovieId, setRemovingMovieId] = useState<string | null>(null);

  const loadWatchlist = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setState("loading");
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { items?: WatchlistEntry[] };
      setItems(data.items ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        const data = res.ok ? ((await res.json()) as { items?: WatchlistEntry[] }) : null;
        if (!cancelled) {
          setItems(data?.items ?? []);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Optimistic remove with rollback on failure.
  const handleRemove = useCallback(async (movieId: string) => {
    setRemovingMovieId(movieId);
    const previous = items;
    setItems((prev) => prev.filter((i) => i.movieId !== movieId));
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(movieId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("remove failed");
    } catch {
      setItems(previous);
    } finally {
      setRemovingMovieId(null);
    }
  }, [items]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
      <div className="mda-ticket my-auto max-w-3xl w-full relative">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
          🔖 {t("title")}
        </h1>
        <p className="text-muted text-xs sm:text-sm mb-5 sm:mb-6">
          {t("subtitle")}
          {state === "ready" && items.length > 0 && (
            <span className="font-bold text-ink">
              {" · "}
              {t("itemCount", { count: items.length })}
            </span>
          )}
        </p>

        {state === "loading" && (
          <div className="flex justify-center gap-2 py-10" aria-live="polite">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping delay-100" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping delay-200" />
          </div>
        )}

        {state === "error" && (
          <div className="text-center py-10">
            <p className="text-muted mb-4 text-sm">{t("loadFailed")}</p>
            <SecondaryButton onClick={() => loadWatchlist(true)}>{t("retry")}</SecondaryButton>
          </div>
        )}

        {state === "ready" && items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3" aria-hidden="true">
              🔖
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">{t("emptyTitle")}</h2>
            <p className="text-muted mb-5 text-sm leading-relaxed">{t("emptySubtitle")}</p>
            <TicketPerforation />
            <Link
              href="/"
              className="mda-btn-primary mda-focus inline-block px-6 py-3 text-sm sm:text-base mt-4"
            >
              {t("suggestMovie")}
            </Link>
          </div>
        )}

        {state === "ready" && items.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {items.map((item) => (
              <WatchlistItemCard
                key={item.movieId}
                entry={item}
                locale={locale}
                removing={removingMovieId === item.movieId}
                onRemove={handleRemove}
                genreTranslator={tGenres}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function WatchlistItemCard({
  entry,
  locale,
  removing,
  onRemove,
  genreTranslator,
}: {
  entry: WatchlistEntry;
  locale: string;
  removing: boolean;
  onRemove: (movieId: string) => void;
  genreTranslator: ReturnType<typeof useTranslations<"genres">>;
}) {
  const t = useTranslations("watchlist");
  const formattedYear = entry.releaseYear
    ? formatLocalizedNumber(entry.releaseYear, locale)
    : null;
  const formattedRuntime = formatLocalizedNumber(entry.runtimeMinutes, locale);
  const localizedGenres = entry.genres.map((g) => {
    const genreKey = g as Parameters<typeof genreTranslator>[0];
    return genreTranslator.has(genreKey) ? genreTranslator(genreKey) : g;
  });
  const localizedOverview = getMovieOverview(entry, locale);
  const { primaryTitle, originalTitle } = getMovieTitle(entry, locale);

  return (
    <li className="mda-ticket p-4 flex gap-3 sm:gap-4 items-start">
      <div className="relative shrink-0">
        <MoviePoster title={entry.title} posterPath={entry.posterPath} />
        <button
          type="button"
          onClick={() => onRemove(entry.movieId)}
          disabled={removing}
          aria-label={`${t("remove")}: ${entry.title}`}
          title={t("remove")}
          className="absolute top-1.5 end-1.5 w-7 h-7 rounded-full border-2 border-line bg-surface text-ink hover:bg-accent hover:text-accent-text active:scale-95 flex items-center justify-center font-bold text-xs cursor-pointer transition-all disabled:opacity-50 mda-focus"
        >
          {removing ? "…" : "✕"}
        </button>
      </div>
      <div className="min-w-0 flex-1 text-start">
        <h2 className="text-base sm:text-lg font-extrabold leading-tight mb-0.5">
          {primaryTitle}
        </h2>
        {originalTitle && (
          <p className="font-mono text-[11px] font-bold text-muted mb-1.5 opacity-80" dir="ltr">
            {originalTitle}
          </p>
        )}
        <p className="text-muted text-[11px] sm:text-xs mb-2 font-semibold">
          {formattedYear ?? "—"} · {formattedRuntime}
        </p>
        {localizedGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {localizedGenres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-1.5 py-0.5 text-[10px] font-bold border-2 border-line bg-surface-raised rounded-md"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        {localizedOverview && (
          <p className="text-[11px] sm:text-xs leading-relaxed text-muted line-clamp-3">
            {localizedOverview}
          </p>
        )}
      </div>
    </li>
  );
}
