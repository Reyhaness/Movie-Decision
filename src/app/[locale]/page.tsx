"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, ChipGroup, PrimaryButton, SecondaryButton } from "@/components/ui";
import { TIME_SELECTIONS, STANDARD_MOODS, SITUATION_SELECTIONS } from "@/services/recommendation/types";
import type { SituationSelection, TimeSelection } from "@/services/recommendation/types";
import { useFlowStore } from "@/lib/sessionStore";
import type { MoodChoice } from "@/lib/sessionStore";

const RELAX_ORDER: TimeSelection[] = ["under_90", "90_to_120", "over_120"];

export default function Home() {
  const tLanding = useTranslations("landing");
  const tPref = useTranslations("preferences");
  const tTime = useTranslations("time");
  const tMood = useTranslations("mood");
  const tSituation = useTranslations("situation");
  const tLoading = useTranslations("loading");
  const tResult = useTranslations("result");
  const tAccepted = useTranslations("accepted");
  const tNoMatch = useTranslations("no_match");
  const tError = useTranslations("error");

  const [flow, updateFlow, resetFlow] = useFlowStore();
  const [busy, setBusy] = useState(false);

  const fetchRecommendation = useCallback(async () => {
    if (!flow.time || !flow.mood || !flow.situation) return;
    setBusy(true);
    updateFlow({ state: "loading" });
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: flow.time,
          mood: flow.mood,
          situation: flow.situation,
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
  }, [flow.time, flow.mood, flow.situation, flow.sessionId, flow.shownMovieIds, updateFlow]);

  const tryAnother = useCallback(async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "try_another", sessionId: flow.sessionId }),
    }).catch(() => undefined);
    await fetchRecommendation();
  }, [flow.sessionId, fetchRecommendation]);

  const accept = useCallback(async () => {
    if (!flow.result || !flow.sessionId) return;
    const done = () => updateFlow({ state: "accepted" });
    try {
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: flow.sessionId, movieId: flow.result.movieId }),
      });
      if (res.ok) done();
      else done();
    } catch {
      done();
    }
  }, [flow.result, flow.sessionId, updateFlow]);

  const relaxTime = () => {
    if (!flow.time) return;
    const idx = RELAX_ORDER.indexOf(flow.time);
    const next = RELAX_ORDER[Math.min(idx + 1, RELAX_ORDER.length - 1)];
    updateFlow({ time: next });
  };

  const backToPreferences = () => updateFlow({ state: "preferences" });

  if (flow.state === "landing") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-10 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">
            🎬
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            {tLanding("title")}
          </h1>
          <p className="text-muted mb-8 leading-relaxed">
            {tLanding("description")}
          </p>
          <PrimaryButton onClick={() => updateFlow({ state: "preferences" })}>
            {tLanding("helpMePick")}
          </PrimaryButton>
        </Card>
      </main>
    );
  }

  if (flow.state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" aria-live="polite">
        <Card className="max-w-md w-full p-10 text-center">
          <p className="text-lg font-bold mb-2">{tLoading("title")}</p>
          <p className="text-muted text-sm">{tLoading("subtitle")}</p>
        </Card>
      </main>
    );
  }

  if (flow.state === "result" && flow.result) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-xl w-full p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            {tResult("badge")}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 mb-6">
            <div className="w-full sm:w-auto flex justify-center sm:block shrink-0">
              <MoviePoster title={flow.result.title} posterPath={flow.result.posterPath} />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1.5">{flow.result.title}</h1>
              <p className="text-muted text-sm mb-2 font-medium">
                {flow.result.releaseYear ?? tResult("yearUnknown")} · {flow.result.runtimeMinutes} {tResult("min")}
              </p>
              {flow.result.genres.length > 0 && (
                <p className="text-xs text-muted tracking-wide mb-3">{flow.result.genres.join(" · ")}</p>
              )}
              {flow.result.overview && (
                <p className="text-sm leading-relaxed text-muted-foreground">{flow.result.overview}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={accept}>{tResult("accept")}</PrimaryButton>
            <div className="flex gap-3 justify-center">
              <SecondaryButton onClick={tryAnother} disabled={busy}>
                {tResult("tryAnother")}
              </SecondaryButton>
              <SecondaryButton onClick={backToPreferences}>
                {tResult("changePreferences")}
              </SecondaryButton>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  if (flow.state === "accepted") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            {tAccepted("badge")}
          </p>
          <h1 className="text-2xl font-extrabold mb-2">{flow.result?.title}</h1>
          <p className="text-muted mb-8 leading-relaxed">{tAccepted("subtitle")}</p>
          <PrimaryButton onClick={resetFlow}>{tAccepted("startOver")}</PrimaryButton>
        </Card>
      </main>
    );
  }

  if (flow.state === "no_match") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <h1 className="text-2xl font-extrabold mb-2 leading-tight">{tNoMatch("title")}</h1>
          <p className="text-muted mb-8 leading-relaxed">{tNoMatch("subtitle")}</p>
          <div className="flex flex-col items-center gap-3">
            {flow.time !== "over_120" && (
              <PrimaryButton
                onClick={() => {
                  relaxTime();
                  updateFlow({ state: "preferences" });
                }}
              >
                {tNoMatch("relaxTime")}
              </PrimaryButton>
            )}
            <SecondaryButton onClick={backToPreferences}>
              {tNoMatch("changePreferences")}
            </SecondaryButton>
            <SecondaryButton onClick={tryAnother} disabled={busy}>
              {tNoMatch("tryAnother")}
            </SecondaryButton>
          </div>
        </Card>
      </main>
    );
  }

  if (flow.state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <h1 className="text-2xl font-extrabold mb-2">{tError("title")}</h1>
          <p className="text-muted mb-8">{tError("subtitle")}</p>
          <div className="flex flex-col items-center gap-3">
            <PrimaryButton onClick={fetchRecommendation}>{tError("tryAgain")}</PrimaryButton>
            <SecondaryButton onClick={backToPreferences}>
              {tError("changePreferences")}
            </SecondaryButton>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">{tPref("title")}</h1>
        <p className="text-muted mb-8 leading-relaxed">
          {tPref("subtitle")}
        </p>
        <div className="space-y-7">
          <ChipGroup
            legend={tPref("timeLegend")}
            options={TIME_SELECTIONS.map((t) => ({ value: t, label: tTime(t) }))}
            value={flow.time}
            onChange={(v) => updateFlow({ time: v as TimeSelection })}
          />
          <ChipGroup
            legend={tPref("moodLegend")}
            options={[
              ...STANDARD_MOODS.map((m) => ({
                value: m,
                label: tMood(`labels.${m}`),
                hint: tMood(`hints.${m}`),
              })),
              {
                value: "surprise_me",
                label: tMood("labels.surprise_me"),
                hint: tMood("hints.surprise_me"),
              },
            ]}
            value={flow.mood}
            onChange={(v) => updateFlow({ mood: v as MoodChoice })}
          />
          <ChipGroup
            legend={tPref("situationLegend")}
            options={SITUATION_SELECTIONS.map((s) => ({
              value: s,
              label: tSituation(s),
            }))}
            value={flow.situation}
            onChange={(v) => updateFlow({ situation: v as SituationSelection })}
          />
          <div className="pt-2 flex items-center gap-4">
            <PrimaryButton onClick={fetchRecommendation} disabled={!flow.time || !flow.mood || !flow.situation}>
              {tPref("helpMePick")}
            </PrimaryButton>
            <SecondaryButton onClick={resetFlow}>{tPref("startOver")}</SecondaryButton>
          </div>
        </div>
      </Card>
    </main>
  );
}

function MoviePoster({ title, posterPath }: { title: string; posterPath?: string | null }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!posterPath || imageError) {
    return <PosterFallback title={title} />;
  }

  const imageUrl = `https://image.tmdb.org/t/p/w500${posterPath.startsWith("/") ? posterPath : `/${posterPath}`}`;

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-none sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-line bg-surface-raised shadow-md">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-surface-raised animate-pulse flex items-center justify-center">
          <span className="text-xs text-muted">...</span>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={`Poster for ${title}`}
        fill
        sizes="(max-width: 640px) 280px, 192px"
        className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
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
      className="w-full max-w-[280px] sm:max-w-none sm:w-48 aspect-[2/3] rounded-2xl border-2 border-line bg-surface-raised flex items-center justify-center"
    >
      <span className="text-3xl sm:text-4xl font-extrabold text-muted">{initials}</span>
    </div>
  );
}
