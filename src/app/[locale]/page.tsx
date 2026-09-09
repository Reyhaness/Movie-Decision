"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChipGroup, PrimaryButton, SecondaryButton, TicketPerforation } from "@/components/ui";
import { TIME_SELECTIONS, STANDARD_MOODS, SITUATION_SELECTIONS } from "@/services/recommendation/types";
import type { SituationSelection, TimeSelection } from "@/services/recommendation/types";
import { useFlowStore } from "@/lib/sessionStore";
import type { MoodChoice } from "@/lib/sessionStore";
import { formatLocalizedNumber } from "@/lib/format";
import { getMovieOverview } from "@/lib/movieTranslations";

const RELAX_ORDER: TimeSelection[] = ["under_90", "90_to_120", "over_120"];

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

  const [flow, updateFlow, resetFlow] = useFlowStore();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stamped, setStamped] = useState(false);
  const [blinkingKey, setBlinkingKey] = useState<string | null>(null);

  const handleTimeSelect = (val: string) => {
    setBlinkingKey(val);
    setTimeout(() => {
      updateFlow({ time: val as TimeSelection });
      setBlinkingKey(null);
      setStep(2);
    }, 240);
  };

  const handleMoodSelect = (val: string) => {
    setBlinkingKey(val);
    setTimeout(() => {
      updateFlow({ mood: val as MoodChoice });
      setBlinkingKey(null);
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

  const backToPreferences = () => {
    setStamped(false);
    setStep(1);
    updateFlow({ state: "preferences" });
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
              onClick={() => updateFlow({ state: "preferences" })}
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

    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-xl w-full relative">
          {/* Rubber Stamp */}
          <div className={`mda-stamp ${stamped ? "active" : ""}`} aria-hidden="true">
            {tResult("stamped")}
          </div>

          {/* Header Ticket Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap font-mono text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider pb-3 mb-4 sm:mb-5 border-b-2 border-line">
            <span className="text-accent font-extrabold flex items-center gap-1 shrink-0">
              <span>★</span> {tResult("badge")}
            </span>
            <span className="shrink-0">{tResult("admitOne")} // NO. 9482</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 items-center sm:items-start">
            <div className="w-full sm:w-auto flex justify-center sm:block shrink-0">
              <MoviePoster title={flow.result.title} posterPath={flow.result.posterPath} />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-start text-center sm:text-start">
              <h1 className="text-xl sm:text-3xl font-extrabold leading-tight mb-1.5 sm:mb-2">
                {flow.result.title}
              </h1>
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

          {/* Ticket Footer with Barcode & Seat info */}
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] text-muted mb-5 select-none">
            <span className="tracking-wider sm:tracking-widest shrink-0">||| |||| || | ||||| |</span>
            <span className="shrink-0">{tResult("seat")}</span>
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
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------- */
  /* ACCEPTED VIEW: CONFIRMED TICKET STUB                 */
  /* ---------------------------------------------------- */
  if (flow.state === "accepted") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-3 pt-20 pb-8 sm:p-6 sm:py-12">
        <div className="mda-ticket my-auto max-w-md w-full text-center relative">
          <div className="text-5xl mb-4" aria-hidden="true">
            🍿
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
            {tAccepted("badge")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">{flow.result?.title}</h1>
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

  const moodOptions = [
    ...STANDARD_MOODS.map((m) => ({
      value: m,
      label: tMood(`labels.${m}`),
      hint: tMood(`hints.${m}`),
      emoji: moodEmojiMap[m] ?? "🎬",
    })),
    {
      value: "surprise_me",
      label: tMood("labels.surprise_me"),
      hint: tMood("hints.surprise_me"),
      emoji: "🎲",
      colSpan: "col-span-2",
    },
  ];

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
          <div className="flex items-center justify-between gap-2 font-mono text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>PUNCH CARD</span>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.time ? "bg-accent scale-110 shadow-sm" : "bg-surface-raised"
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.mood ? "bg-accent scale-110 shadow-sm" : "bg-surface-raised"
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full border-2 border-line transition-all ${
                    flow.situation ? "bg-accent scale-110 shadow-sm" : "bg-surface-raised"
                  }`}
                />
              </div>
            </div>
            <span className="text-accent font-extrabold shrink-0">
              {tPref("stepIndicator", { current: step, total: 3 })}
            </span>
          </div>

          {/* Clickable Badges for chosen preferences */}
          {(flow.time || flow.mood || flow.situation) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/40">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted select-none me-1">
                {tPref("yourChoices")}
              </span>
              {flow.time && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
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
                  onClick={() => setStep(2)}
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
                  onClick={() => setStep(3)}
                  className={`mda-badge ${step === 3 ? "mda-badge-active" : ""}`}
                  title={locale === "fa" ? "ویرایش همراهان" : "Edit company"}
                >
                  <span>🍿</span>
                  <span>{tSituation(flow.situation)}</span>
                  <span className="text-[9px] opacity-70">✏️</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 1: Time */}
        {step === 1 && (
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                ⏱️ {tPref("step1")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step1Subtitle")}</p>
            </div>

            <ChipGroup
              legend={tPref("timeLegend")}
              options={timeOptions}
              value={flow.time}
              blinkingValue={blinkingKey}
              onChange={handleTimeSelect}
            />

            <TicketPerforation />

            <div className="flex justify-between items-center gap-3 pt-2">
              <SecondaryButton onClick={resetFlow}>{tPref("startOver")}</SecondaryButton>
            </div>
          </div>
        )}

        {/* Step 2: Mood */}
        {step === 2 && (
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                🎭 {tPref("step2")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step2Subtitle")}</p>
            </div>

            <ChipGroup
              legend={tPref("moodLegend")}
              options={moodOptions}
              value={flow.mood}
              blinkingValue={blinkingKey}
              onChange={handleMoodSelect}
            />

            <TicketPerforation />

            <div className="flex justify-between items-center gap-3 pt-2">
              <SecondaryButton onClick={() => setStep(1)}>{tPref("back")}</SecondaryButton>
            </div>
          </div>
        )}

        {/* Step 3: Situation */}
        {step === 3 && (
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                🍿 {tPref("step3")}
              </h2>
              <p className="text-muted text-xs sm:text-sm">{tPref("step3Subtitle")}</p>
            </div>

            <ChipGroup
              legend={tPref("situationLegend")}
              options={situationOptions}
              value={flow.situation}
              onChange={handleSituationSelect}
            />

            <TicketPerforation />

            <div className="flex justify-between items-center gap-3 pt-2">
              <SecondaryButton onClick={() => setStep(2)}>{tPref("back")}</SecondaryButton>
              <PrimaryButton
                disabled={!flow.time || !flow.mood || !flow.situation}
                onClick={() => fetchRecommendation()}
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

function MoviePoster({ title, posterPath }: { title: string; posterPath?: string | null }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!posterPath || imageError) {
    return <PosterFallback title={title} />;
  }

  const imageUrl = `https://image.tmdb.org/t/p/w500${
    posterPath.startsWith("/") ? posterPath : `/${posterPath}`
  }`;

  return (
    <div className="relative w-36 xs:w-40 sm:w-44 max-w-full aspect-[2/3] rounded-xl overflow-hidden border-3 border-line bg-surface-raised shadow-md shrink-0">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-surface-raised animate-pulse flex items-center justify-center">
          <span className="text-xs text-muted">...</span>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={`Poster for ${title}`}
        fill
        priority
        sizes="(max-width: 640px) 160px, 176px"
        className={`object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}

function PosterFallback({ title }: { title: string }) {
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden="true"
      className="w-36 xs:w-40 sm:w-44 max-w-full aspect-[2/3] rounded-xl border-3 border-line bg-surface-raised flex items-center justify-center shrink-0"
    >
      <span className="text-3xl sm:text-4xl font-extrabold text-muted">{initials}</span>
    </div>
  );
}
