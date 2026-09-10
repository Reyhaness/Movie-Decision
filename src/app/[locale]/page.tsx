"use client";

import { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useLocale, useTranslations } from "next-intl";
import { Barcode, ChipGroup, PrimaryButton, SecondaryButton, TicketPerforation, MoviePoster, WatchlistButton } from "@/components/ui";
import { TIME_SELECTIONS, STANDARD_MOODS, SITUATION_SELECTIONS } from "@/services/recommendation/types";
import type { SituationSelection, TimeSelection } from "@/services/recommendation/types";
import { useFlowStore } from "@/lib/sessionStore";
import type { MoodChoice } from "@/lib/sessionStore";
import { formatLocalizedNumber } from "@/lib/format";
import { getMovieOverview, getMovieTitle } from "@/lib/movieTranslations";
import { getRandomPreferences } from "@/lib/randomPreferences";

const RELAX_ORDER: TimeSelection[] = ["under_90", "90_to_120", "over_120"];

function fireCelebrationConfetti() {
  if (typeof window === "undefined") return;

  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const colors = ["#f59e0b", "#e11d48", "#0ea5e9", "#10b981", "#8b5cf6", "#fef3c7"];

  const defaults = {
    startVelocity: 35,
    spread: 360,
    ticks: 80,
    zIndex: 99999,
    disableForReducedMotion: true,
  };

  // Immediate center celebratory cannon
  confetti({
    ...defaults,
    particleCount: 70,
    spread: 100,
    origin: { y: 0.65 },
    colors,
  });

  // Sustained festive flurry from both sides
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = Math.floor(25 * (timeLeft / duration));
    confetti({
      ...defaults,
      particleCount,
      angle: 60,
      spread: 60,
      origin: { x: 0.1, y: 0.75 },
      colors,
    });
    confetti({
      ...defaults,
      particleCount,
      angle: 120,
      spread: 60,
      origin: { x: 0.9, y: 0.75 },
      colors,
    });
  }, 250);
}

if (typeof window !== "undefined") {
  (window as unknown as { fireCelebrationConfetti?: () => void }).fireCelebrationConfetti = fireCelebrationConfetti;
}

export default function Home() {
  const locale = useLocale();
  const tLanding = useTranslations("landing");
  const tPref = useTranslations("preferences");
  const tTime = useTranslations("time");
  const tMood = useTranslations("mood");
  const tSituation = useTranslations("situation");
  const tLoading = useTranslations("loading");
  const tResult = useTranslations("result");
  const tGenres = useTranslations("genres");
  const tAccepted = useTranslations("accepted");
  const tNoMatch = useTranslations("no_match");
  const tError = useTranslations("error");
  const tWatchlist = useTranslations("watchlist");

  type HistoryEntry =
    | { state: "landing" }
    | { state: "preferences"; step: 1 | 2 | 3 }
    | { state: "result" };

  const [flow, updateFlow, resetFlow] = useFlowStore();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stamped, setStamped] = useState(false);
  const [blinkingKey, setBlinkingKey] = useState<string | null>(null);
  const [rollingDice, setRollingDice] = useState(false);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (flow.state === "accepted") {
      fireCelebrationConfetti();
    }
  }, [flow.state]);

  const handleRollDice = () => {
    setRollingDice(true);
    setHistoryStack((prev) => [...prev, { state: "preferences", step }]);
    const randomPrefs = getRandomPreferences();
    updateFlow({
      time: randomPrefs.time,
      mood: randomPrefs.mood,
      situation: randomPrefs.situation,
      state: "preferences",
    });
    setStep(3);
    setTimeout(() => {
      setRollingDice(false);
    }, 400);
  };

  const handleTimeSelect = (val: string) => {
    setBlinkingKey(val);
    setTimeout(() => {
      updateFlow({ time: val as TimeSelection });
      setBlinkingKey(null);
      setHistoryStack((prev) => [...prev, { state: "preferences", step: 1 }]);
      setStep(2);
    }, 240);
  };

  const handleMoodSelect = (val: string) => {
    setBlinkingKey(val);
    setTimeout(() => {
      updateFlow({ mood: val as MoodChoice });
      setBlinkingKey(null);
      setHistoryStack((prev) => [...prev, { state: "preferences", step: 2 }]);
      setStep(3);
    }, 240);
  };

  const handleSituationSelect = (val: string) => {
    updateFlow({ situation: val as SituationSelection });
  };

  const fetchRecommendation = useCallback(
    async (overrideParams?: {
      time?: TimeSelection;
      mood?: MoodChoice;
      situation?: SituationSelection;
    }) => {
      const targetTime = overrideParams?.time ?? flow.time;
      const targetMood = overrideParams?.mood ?? flow.mood;
      const targetSituation = overrideParams?.situation ?? flow.situation;

      if (!targetTime || !targetMood || !targetSituation) return;

      setBusy(true);
      updateFlow({
        state: "loading",
        time: targetTime,
        mood: targetMood,
        situation: targetSituation,
      });

      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            time: targetTime,
            mood: targetMood,
            situation: targetSituation,
            sessionId: flow.sessionId ?? undefined,
            excludedMovieIds: flow.shownMovieIds,
          }),
        });

        if (!res.ok) {
          updateFlow({ state: "error" });
          return;
        }

        const data = await res.json();
        if (data.status === "success" && data.movie) {
          const nextShown = flow.shownMovieIds.includes(data.movie.movieId)
            ? flow.shownMovieIds
            : [...flow.shownMovieIds, data.movie.movieId];
          setStamped(false);
          setHistoryStack((prev) => [...prev, { state: "preferences", step: 3 }]);
          updateFlow({
            sessionId: data.sessionId,
            result: data.movie,
            shownMovieIds: nextShown,
            state: "result",
          });
        } else if (data.status === "no_candidates" || data.status === "no_strong_match") {
          updateFlow({
            sessionId: data.sessionId,
            state: "no_match",
          });
        } else {
          updateFlow({ state: "error" });
        }
      } catch {
        updateFlow({ state: "error" });
      } finally {
        setBusy(false);
      }
    },
    [flow.time, flow.mood, flow.situation, flow.sessionId, flow.shownMovieIds, updateFlow]
  );

  const handleSurpriseMe = useCallback(async () => {
    const randomTime: TimeSelection =
      TIME_SELECTIONS[Math.floor(Math.random() * TIME_SELECTIONS.length)];
    const randomSituation: SituationSelection =
      SITUATION_SELECTIONS[Math.floor(Math.random() * SITUATION_SELECTIONS.length)];
    await fetchRecommendation({
      time: randomTime,
      mood: "surprise_me",
      situation: randomSituation,
    });
  }, [fetchRecommendation]);

  const tryAnother = useCallback(async () => {
    setStamped(false);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "try_another", sessionId: flow.sessionId }),
    }).catch(() => undefined);
    await fetchRecommendation();
  }, [flow.sessionId, fetchRecommendation]);

  const accept = useCallback(async () => {
    if (!flow.result || !flow.sessionId) return;
    setStamped(true);
    setTimeout(async () => {
      try {
        await fetch("/api/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: flow.sessionId, movieId: flow.result?.movieId }),
        });
      } finally {
        updateFlow({ state: "accepted" });
      }
    }, 450);
  }, [flow.result, flow.sessionId, updateFlow]);

  const relaxTime = () => {
    if (!flow.time) return;
    const idx = RELAX_ORDER.indexOf(flow.time);
    const next = RELAX_ORDER[Math.min(idx + 1, RELAX_ORDER.length - 1)];
    updateFlow({ time: next });
  };

  // --- Watchlist (independent capability; never touches recommendation flow) ---
  const [savedMovieIds, setSavedMovieIds] = useState<Set<string>>(new Set());
  const [savingState, setSavingState] = useState<"idle" | "saving" | "error">("idle");

  // Load saved state when a recommendation is shown, so the bookmark
  // reflects the guest's existing watchlist (idempotent sync, failure-tolerant).
  useEffect(() => {
    if (flow.state !== "result" || !flow.result) return;
    let cancelled = false;
    fetch("/api/watchlist")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: Array<{ movieId: string }> } | null) => {
        if (!cancelled && data?.items) {
          setSavedMovieIds(new Set(data.items.map((i) => i.movieId)));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [flow.state, flow.result]);

  const toggleSave = useCallback(async () => {
    const movie = flow.result;
    if (!movie || savingState === "saving") return;
    const wasSaved = savedMovieIds.has(movie.movieId);
    setSavingState("saving");
    try {
      if (wasSaved) {
        const res = await fetch(`/api/watchlist/${encodeURIComponent(movie.movieId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("remove failed");
        setSavedMovieIds((prev) => {
          const next = new Set(prev);
          next.delete(movie.movieId);
          return next;
        });
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          body: JSON.stringify({ movieId: movie.movieId }),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("save failed");
        setSavedMovieIds((prev) => new Set(prev).add(movie.movieId));
      }
      setSavingState("idle");
    } catch {
      // Non-critical feature: never block the recommendation flow.
      setSavingState("error");
    }
  }, [flow.result, savingState, savedMovieIds]);

  // Transient inline error: auto-dismiss so the card returns to normal.
  useEffect(() => {
    if (savingState !== "error") return;
    const timer = setTimeout(() => setSavingState("idle"), 3500);
    return () => clearTimeout(timer);
  }, [savingState]);

  const jumpToStep = (targetStep: 1 | 2 | 3) => {
    setStamped(false);
    if (flow.state === "result") {
      setHistoryStack((prev) => [...prev, { state: "result" }]);
    } else if (flow.state === "preferences" && step !== targetStep) {
      setHistoryStack((prev) => [...prev, { state: "preferences", step }]);
    }
    setStep(targetStep);
    updateFlow({ state: "preferences" });
  };

  const handleBack = () => {
    if (historyStack.length > 0) {
      const nextHistory = [...historyStack];
      const prevEntry = nextHistory.pop()!;
      setHistoryStack(nextHistory);

      if (prevEntry.state === "landing") {
        updateFlow({ state: "landing" });
      } else if (prevEntry.state === "result" && flow.result) {
        updateFlow({ state: "result" });
      } else if (prevEntry.state === "preferences") {
        setStep(prevEntry.step);
        updateFlow({ state: "preferences" });
      }
      return;
    }

    // Fallback if history stack is empty:
    if (flow.state === "result") {
      setStep(3);
      updateFlow({ state: "preferences" });
    } else if (flow.state === "preferences") {
      if (step > 1) {
        setStep((step - 1) as 1 | 2 | 3);
      } else if (flow.result) {
        updateFlow({ state: "result" });
      } else {
        updateFlow({ state: "landing" });
      }
    } else {
      updateFlow({ state: "landing" });
    }
  };

  const backToPreferences = () => {
    jumpToStep(1);
  };

  /* ---------------------------------------------------- */
  /* LANDING VIEW: RETRO CINEMA TICKET                    */
  /* ---------------------------------------------------- */
  if (flow.state === "landing") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-lg w-full text-center relative">
          <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider mb-5 sm:mb-6 pb-2.5 border-b-2 border-line">
            <span>🎟️ ADMIT ONE</span>
            <span>NO. 4829</span>
          </div>

          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4" aria-hidden="true">
            🎬
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2.5 sm:mb-3">
            {tLanding("title")}
          </h1>
          <p className="text-muted mb-5 sm:mb-6 leading-relaxed text-xs sm:text-base">
            {tLanding("description")}
          </p>

          <TicketPerforation />

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-stretch pt-2">
            <PrimaryButton
              className="w-full sm:w-auto"
              onClick={() => {
                setHistoryStack([{ state: "landing" }]);
                setStep(1);
                updateFlow({ state: "preferences" });
              }}
            >
              {tLanding("helpMePick")}
            </PrimaryButton>
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="mda-btn-lucky w-full sm:w-auto px-5 py-3 text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{tLanding("luckyTicket")}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* LOADING VIEW: PRINTING TICKET                        */
  /* ---------------------------------------------------- */
  if (flow.state === "loading") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12"
        aria-live="polite"
      >
        <div className="mda-ticket my-auto max-w-md w-full text-center relative">
          <div className="text-4xl mb-4 animate-bounce">🎟️</div>
          <p className="text-lg font-extrabold mb-2">{tLoading("title")}</p>
          <p className="text-muted text-sm">{tLoading("subtitle")}</p>
          <div className="mt-6 flex justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping delay-100" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping delay-200" />
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* RESULT VIEW: FULL AUTHENTIC CINEMA TICKET            */
  /* ---------------------------------------------------- */
  if (flow.state === "result" && flow.result) {
    const formattedYear = flow.result.releaseYear
      ? formatLocalizedNumber(flow.result.releaseYear, locale)
      : null;
    const formattedRuntime = formatLocalizedNumber(flow.result.runtimeMinutes, locale);
    const localizedGenres = flow.result.genres.map((g) => {
      const genreKey = g as Parameters<typeof tGenres>[0];
      return tGenres.has(genreKey) ? tGenres(genreKey) : g;
    });
    const localizedOverview = getMovieOverview(flow.result, locale);
    const { primaryTitle, originalTitle } = getMovieTitle(flow.result, locale);

    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-xl w-full relative">
          {/* Rubber Stamp */}
          <div className={`mda-stamp ${stamped ? "active" : ""}`} aria-hidden="true">
            {tResult("stamped")}
          </div>

          {/* Header Ticket Bar with Clean Badge and Clickable Applied Filters */}
          <div className="pb-3 mb-4 sm:mb-5 border-b-2 border-line space-y-2">
            <div className="flex items-center justify-between gap-2 font-bold text-xs sm:text-sm text-muted">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-8 h-8 rounded-lg border-2 border-line bg-surface hover:bg-surface-raised active:scale-95 flex items-center justify-center font-bold text-ink shadow-[2px_2px_0px_0px_var(--color-line)] transition-all cursor-pointer shrink-0"
                  title={tPref("back")}
                  aria-label={tPref("back")}
                >
                  <svg
                    className="w-4 h-4 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>

                <span className="text-accent font-extrabold flex items-center gap-1.5 shrink-0">
                  <span className="text-sm">★</span>
                  <span>{tResult("badge")}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-line bg-accent scale-105 shadow-sm" />
                <span className="w-3.5 h-3.5 rounded-full border-2 border-line bg-accent scale-105 shadow-sm" />
                <span className="w-3.5 h-3.5 rounded-full border-2 border-line bg-accent scale-105 shadow-sm" />
              </div>
            </div>

            {/* Clickable Filter Badges: 1-Click return to edit any filter */}
            {(flow.time || flow.mood || flow.situation) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {flow.time && (
                  <button
                    type="button"
                    onClick={() => jumpToStep(1)}
                    className="mda-badge"
                    title={locale === "fa" ? "ویرایش زمان" : "Edit time"}
                  >
                    <span>⚡</span>
                    <span>{tTime(flow.time)}</span>
                    <span className="text-[10px] opacity-70">✏️</span>
                  </button>
                )}
                {flow.mood && (
                  <button
                    type="button"
                    onClick={() => jumpToStep(2)}
                    className="mda-badge"
                    title={locale === "fa" ? "ویرایش حال‌وهوا" : "Edit mood"}
                  >
                    <span>🎭</span>
                    <span>{tMood(`labels.${flow.mood}`)}</span>
                    <span className="text-[10px] opacity-70">✏️</span>
                  </button>
                )}
                {flow.situation && (
                  <button
                    type="button"
                    onClick={() => jumpToStep(3)}
                    className="mda-badge"
                    title={locale === "fa" ? "ویرایش همراهان" : "Edit company"}
                  >
                    <span>🍿</span>
                    <span>{tSituation(flow.situation)}</span>
                    <span className="text-[10px] opacity-70">✏️</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 items-center sm:items-start">
            <div className="w-full sm:w-auto flex justify-center sm:block shrink-0">
              <div className="inline-flex flex-col gap-2.5">
                <MoviePoster title={flow.result.title} posterPath={flow.result.posterPath} />
                <WatchlistButton
                  saved={flow.result ? savedMovieIds.has(flow.result.movieId) : false}
                  disabled={savingState === "saving"}
                  onToggle={toggleSave}
                  className="w-full justify-center"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-start text-center sm:text-start">
              <h1 className="text-xl sm:text-3xl font-extrabold leading-tight mb-1">
                {primaryTitle}
              </h1>
              {originalTitle && (
                <p className="font-mono text-xs sm:text-sm font-bold text-muted mb-2 opacity-80" dir="ltr">
                  {originalTitle}
                </p>
              )}
              <p className="text-muted text-xs sm:text-sm mb-2 font-semibold">
                {formattedYear ?? tResult("yearUnknown")} · {formattedRuntime} {tResult("min")}
              </p>
              {localizedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 justify-center sm:justify-start">
                  {localizedGenres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 text-xs font-bold border-2 border-line bg-surface-raised rounded-md"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {localizedOverview && (
                <p className="text-xs sm:text-sm leading-relaxed text-muted mt-1">{localizedOverview}</p>
              )}
            </div>
          </div>

          <TicketPerforation />

          {/* Ticket Footer with Real Cinema-Style Barcode */}
          <div className="flex items-center justify-between gap-3 mb-5 select-none pt-1">
            <Barcode />
            <span className="text-[11px] sm:text-xs font-semibold text-muted">
              {locale === "fa" ? "انتخاب نهایی با یک کلیک" : "One click to confirm"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:gap-3">
            <PrimaryButton className="w-full" onClick={accept}>
              {tResult("accept")}
            </PrimaryButton>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
              <SecondaryButton className="w-full sm:w-auto" onClick={tryAnother} disabled={busy}>
                {tResult("tryAnother")}
              </SecondaryButton>
              <SecondaryButton className="w-full sm:w-auto" onClick={backToPreferences}>
                {tResult("changePreferences")}
              </SecondaryButton>
            </div>
            {savingState === "error" && (
              <p role="status" className="text-xs font-semibold text-accent text-center pt-1">
                {tWatchlist("saveFailed")}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* ACCEPTED VIEW: CONFIRMED TICKET STUB                 */
  /* ---------------------------------------------------- */
  if (flow.state === "accepted") {
    const { primaryTitle, originalTitle } = flow.result
      ? getMovieTitle(flow.result, locale)
      : { primaryTitle: "", originalTitle: null };

    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-md w-full text-center relative">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent mb-3 flex items-center justify-center gap-1.5">
            <span>🍿</span>
            <span>{tAccepted("badge")}</span>
          </p>

          {flow.result && (
            <div className="flex justify-center mb-4">
              <MoviePoster
                title={flow.result.title}
                posterPath={flow.result.posterPath}
                className="shadow-[4px_4px_0px_0px_var(--color-line)]"
              />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
            {primaryTitle || flow.result?.title}
          </h1>
          {originalTitle && (
            <p className="font-mono text-xs sm:text-sm font-bold text-muted mb-3 opacity-80" dir="ltr">
              {originalTitle}
            </p>
          )}
          <p className="text-muted mb-6 leading-relaxed text-sm sm:text-base">
            {tAccepted("subtitle")}
          </p>
          <TicketPerforation />
          <PrimaryButton className="w-full sm:w-auto" onClick={resetFlow}>
            {tAccepted("startOver")}
          </PrimaryButton>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* NO MATCH VIEW                                        */
  /* ---------------------------------------------------- */
  if (flow.state === "no_match") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-md w-full text-center relative">
          <h1 className="text-2xl font-extrabold mb-2 leading-tight">{tNoMatch("title")}</h1>
          <p className="text-muted mb-6 leading-relaxed text-sm">{tNoMatch("subtitle")}</p>
          <TicketPerforation />
          <div className="flex flex-col items-stretch sm:items-center gap-2.5 sm:gap-3">
            {flow.time !== "over_120" && (
              <PrimaryButton
                className="w-full sm:w-auto"
                onClick={() => {
                  relaxTime();
                  updateFlow({ state: "preferences" });
                }}
              >
                {tNoMatch("relaxTime")}
              </PrimaryButton>
            )}
            <SecondaryButton className="w-full sm:w-auto" onClick={backToPreferences}>
              {tNoMatch("changePreferences")}
            </SecondaryButton>
            <SecondaryButton className="w-full sm:w-auto" onClick={tryAnother} disabled={busy}>
              {tNoMatch("tryAnother")}
            </SecondaryButton>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* ERROR VIEW                                           */
  /* ---------------------------------------------------- */
  if (flow.state === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-md w-full text-center relative">
          <h1 className="text-2xl font-extrabold mb-2">{tError("title")}</h1>
          <p className="text-muted mb-6 text-sm">{tError("subtitle")}</p>
          <TicketPerforation />
          <div className="flex flex-col items-stretch sm:items-center gap-2.5 sm:gap-3">
            <PrimaryButton className="w-full sm:w-auto" onClick={() => fetchRecommendation()}>
              {tError("tryAgain")}
            </PrimaryButton>
            <SecondaryButton className="w-full sm:w-auto" onClick={backToPreferences}>
              {tError("changePreferences")}
            </SecondaryButton>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* PREFERENCES VIEW: STEP-BY-STEP PUNCH WIZARD          */
  /* ---------------------------------------------------- */
  const timeOptions = [
    { value: "under_90", label: tTime("under_90"), emoji: "⚡" },
    { value: "90_to_120", label: tTime("90_to_120"), emoji: "☕" },
    { value: "over_120", label: tTime("over_120"), emoji: "🛋️", colSpan: "col-span-2" },
  ];

  const moodEmojiMap: Record<string, string> = {
    cozy_relax: "☕",
    funny: "😂",
    thrill_tense: "⚡",
    emotional: "🥺",
    thoughtful_mind_bending: "🧠",
    epic: "⚔️",
  };

  const moodOptions = STANDARD_MOODS.map((m) => ({
    value: m,
    label: tMood(`labels.${m}`),
    hint: tMood(`hints.${m}`),
    emoji: moodEmojiMap[m] ?? "🎬",
  }));

  const situationOptions = [
    { value: "alone", label: tSituation("alone"), emoji: "🧘" },
    { value: "partner", label: tSituation("partner"), emoji: "💑" },
    { value: "friends", label: tSituation("friends"), emoji: "🍕" },
    { value: "family", label: tSituation("family"), emoji: "🏠" },
    { value: "kids", label: tSituation("kids"), emoji: "🎈", colSpan: "col-span-2" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
      <div className="mda-ticket my-auto max-w-xl w-full relative">
        {/* Wizard Punch Progress Bar & Clickable Badges */}
        <div className="pb-3 mb-5 sm:mb-6 border-b-2 border-line space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-muted">
            <button
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-lg border-2 border-line bg-surface hover:bg-surface-raised active:scale-95 flex items-center justify-center font-bold text-ink shadow-[2px_2px_0px_0px_var(--color-line)] transition-all cursor-pointer shrink-0"
              title={tPref("back")}
              aria-label={tPref("back")}
            >
              <svg
                className="w-4 h-4 rtl:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.time ? "bg-accent scale-105 shadow-sm" : "bg-surface-raised"
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.mood ? "bg-accent scale-105 shadow-sm" : "bg-surface-raised"
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.situation ? "bg-accent scale-105 shadow-sm" : "bg-surface-raised"
                  }`}
                />
              </div>
              <span className="text-accent font-extrabold text-xs sm:text-sm">
                {tPref("stepIndicator", {
                  current: formatLocalizedNumber(step, locale),
                  total: formatLocalizedNumber(3, locale),
                })}
              </span>
            </div>
          </div>

          {/* Top Filter Bar with Randomizer Dice 🎲 and Clickable Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/40">
            <button
              type="button"
              onClick={handleRollDice}
              className={`mda-badge cursor-pointer select-none text-base px-2.5 py-1 transition-all ${
                rollingDice ? "animate-spin scale-110" : "hover:scale-105 active:scale-95"
              }`}
              title={locale === "fa" ? "انتخاب تصادفی همه فیلترها 🎲" : "Randomize all filters 🎲"}
              aria-label={locale === "fa" ? "انتخاب تصادفی همه فیلترها" : "Randomize all filters"}
            >
              🎲
            </button>

            {flow.time && (
              <button
                type="button"
                onClick={() => jumpToStep(1)}
                className={`mda-badge ${step === 1 ? "mda-badge-active" : ""}`}
                title={locale === "fa" ? "ویرایش مدت زمان" : "Edit time"}
              >
                <span>⚡</span>
                <span>{tTime(flow.time)}</span>
                <span className="text-[9px] opacity-70">✏️</span>
              </button>
            )}
            {flow.mood && (
              <button
                type="button"
                onClick={() => jumpToStep(2)}
                className={`mda-badge ${step === 2 ? "mda-badge-active" : ""}`}
                title={locale === "fa" ? "ویرایش حال‌وهوا" : "Edit mood"}
              >
                <span>🎭</span>
                <span>{tMood(`labels.${flow.mood}`)}</span>
                <span className="text-[9px] opacity-70">✏️</span>
              </button>
            )}
            {flow.situation && (
              <button
                type="button"
                onClick={() => jumpToStep(3)}
                className={`mda-badge ${step === 3 ? "mda-badge-active" : ""}`}
                title={locale === "fa" ? "ویرایش همراهان" : "Edit company"}
              >
                <span>🍿</span>
                <span>{tSituation(flow.situation)}</span>
                <span className="text-[9px] opacity-70">✏️</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Time */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                ⏱️ {tPref("step1")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step1Subtitle")}</p>
            </div>

            <TicketPerforation />

            <ChipGroup
              legend={tPref("timeLegend")}
              options={timeOptions}
              value={flow.time}
              blinkingValue={blinkingKey}
              onChange={handleTimeSelect}
            />
          </div>
        )}

        {/* Step 2: Mood */}
        {step === 2 && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                🎭 {tPref("step2")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step2Subtitle")}</p>
            </div>

            <TicketPerforation />

            <ChipGroup
              legend={tPref("moodLegend")}
              options={moodOptions}
              value={flow.mood}
              blinkingValue={blinkingKey}
              onChange={handleMoodSelect}
            />
          </div>
        )}

        {/* Step 3: Situation */}
        {step === 3 && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                🍿 {tPref("step3")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step3Subtitle")}</p>
            </div>

            <TicketPerforation />

            <ChipGroup
              legend={tPref("situationLegend")}
              options={situationOptions}
              value={flow.situation}
              onChange={handleSituationSelect}
            />

            <div className="flex justify-center items-center gap-3 pt-3">
              <PrimaryButton
                disabled={!flow.time || !flow.mood || !flow.situation}
                onClick={() => fetchRecommendation()}
                className="w-full sm:w-auto"
              >
                {tLanding("helpMePick")}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
