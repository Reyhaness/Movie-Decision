"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Card, ChipGroup, PrimaryButton, SecondaryButton } from "@/components/ui";
import { TIME_SELECTIONS, STANDARD_MOODS, SITUATION_SELECTIONS } from "@/services/recommendation/types";
import type { StandardMood, SituationSelection, TimeSelection } from "@/services/recommendation/types";

interface MoviePayload {
  movieId: string;
  title: string;
  releaseYear: number | null;
  runtimeMinutes: number;
  overview: string;
  genres: string[];
  posterPath?: string | null;
}

type MoodChoice = StandardMood | "surprise_me";

type FlowState = "landing" | "preferences" | "loading" | "result" | "accepted" | "no_match" | "error";

const MOOD_LABELS: Record<MoodChoice, string> = {
  cozy_relax: "Cozy / Relax",
  funny: "Fun",
  thrill_tense: "Thrill / Tense",
  emotional: "Emotional",
  thoughtful_mind_bending: "Thoughtful / Mind-bending",
  epic: "Epic",
  surprise_me: "Surprise Me",
};

const MOOD_HINTS: Record<StandardMood, string> = {
  cozy_relax: "Warm, comforting, low-stakes",
  funny: "Playful, likely to create laughs",
  thrill_tense: "Suspenseful, exciting, tense",
  emotional: "Moving, emotionally engaging",
  thoughtful_mind_bending: "Cerebral, ambiguous, discussion-provoking",
  epic: "Grand, spectacular, immersive (scale, not length)",
};

const TIME_LABELS: Record<TimeSelection, string> = {
  under_90: "Under 90 min",
  "90_to_120": "90–120 min",
  over_120: "Over 120 min",
};

const SITUATION_LABELS: Record<SituationSelection, string> = {
  alone: "Alone",
  partner: "With Partner",
  friends: "With Friends",
  family: "With Family",
  kids: "Kids",
};

const RELAX_ORDER: TimeSelection[] = ["under_90", "90_to_120", "over_120"];

export default function Home() {
  const [state, setState] = useState<FlowState>("landing");
  const [time, setTime] = useState<TimeSelection | null>(null);
  const [mood, setMood] = useState<MoodChoice | null>(null);
  const [situation, setSituation] = useState<SituationSelection | null>(null);
  const [result, setResult] = useState<MoviePayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shownMovieIds, setShownMovieIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchRecommendation = useCallback(async () => {
    if (!time || !mood || !situation) return;
    setBusy(true);
    setState("loading");
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time,
          mood,
          situation,
          sessionId: sessionId ?? undefined,
          excludedMovieIds: shownMovieIds,
        }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = await res.json();
      setSessionId(data.sessionId);
      if (data.status === "success" && data.movie) {
        setResult(data.movie);
        setShownMovieIds((prev) =>
          prev.includes(data.movie.movieId) ? prev : [...prev, data.movie.movieId]
        );
        setState("result");
      } else if (data.status === "no_candidates" || data.status === "no_strong_match") {
        setState("no_match");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }, [time, mood, situation, sessionId, shownMovieIds]);

  const tryAnother = useCallback(async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "try_another", sessionId }),
    }).catch(() => undefined);
    await fetchRecommendation();
  }, [sessionId, fetchRecommendation]);

  const accept = useCallback(async () => {
    if (!result || !sessionId) return;
    const done = () => setState("accepted");
    try {
      const res = await fetch("/api/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, movieId: result.movieId }),
      });
      if (res.ok) done();
      else done();
    } catch {
      done();
    }
  }, [result, sessionId]);

  const relaxTime = () => {
    if (!time) return;
    const idx = RELAX_ORDER.indexOf(time);
    const next = RELAX_ORDER[Math.min(idx + 1, RELAX_ORDER.length - 1)];
    setTime(next);
  };

  const backToPreferences = () => setState("preferences");

  const startOver = () => {
    setState("landing");
    setResult(null);
    setSessionId(null);
    setShownMovieIds([]);
  };

  if (state === "landing") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-10 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">
            🎬
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Don&apos;t know what to watch?
          </h1>
          <p className="text-muted mb-8">
            Tell us how much time you have, your mood, and who&apos;s watching. We&apos;ll pick one.
          </p>
          <PrimaryButton onClick={() => setState("preferences")}>Help Me Pick</PrimaryButton>
        </Card>
      </main>
    );
  }

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" aria-live="polite">
        <Card className="max-w-md w-full p-10 text-center">
          <p className="text-lg font-bold mb-2">Picking your movie…</p>
          <p className="text-muted text-sm">Finding the best fit for right now.</p>
        </Card>
      </main>
    );
  }

  if (state === "result" && result) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-xl w-full p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Your pick</p>
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 mb-6">
            <div className="w-full sm:w-auto flex justify-center sm:block shrink-0">
              <MoviePoster title={result.title} posterPath={result.posterPath} />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1.5">{result.title}</h1>
              <p className="text-muted text-sm mb-2 font-medium">
                {result.releaseYear ?? "Year unknown"} · {result.runtimeMinutes} min
              </p>
              {result.genres.length > 0 && (
                <p className="text-xs text-muted tracking-wide mb-3">{result.genres.join(" · ")}</p>
              )}
              {result.overview && (
                <p className="text-sm leading-relaxed text-muted-foreground">{result.overview}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={accept}>This works</PrimaryButton>
            <div className="flex gap-3 justify-center">
              <SecondaryButton onClick={tryAnother} disabled={busy}>
                Try Another
              </SecondaryButton>
              <SecondaryButton onClick={backToPreferences}>Change Preferences</SecondaryButton>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  if (state === "accepted") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Enjoy</p>
          <h1 className="text-2xl font-extrabold mb-2">{result?.title}</h1>
          <p className="text-muted mb-8">Good choice. Grab your snacks.</p>
          <PrimaryButton onClick={startOver}>Start Over</PrimaryButton>
        </Card>
      </main>
    );
  }

  if (state === "no_match") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <h1 className="text-2xl font-extrabold mb-2">Nothing is a great fit right now.</h1>
          <p className="text-muted mb-8">We can loosen one of your preferences and try again.</p>
          <div className="flex flex-col items-center gap-3">
            {time !== "over_120" && (
              <PrimaryButton
                onClick={() => {
                  relaxTime();
                  setState("preferences");
                }}
              >
                Relax Time
              </PrimaryButton>
            )}
            <SecondaryButton onClick={backToPreferences}>Change Preferences</SecondaryButton>
            <SecondaryButton onClick={tryAnother} disabled={busy}>
              Try Another
            </SecondaryButton>
          </div>
        </Card>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center">
          <h1 className="text-2xl font-extrabold mb-2">Something went wrong.</h1>
          <p className="text-muted mb-8">Please try again.</p>
          <div className="flex flex-col items-center gap-3">
            <PrimaryButton onClick={fetchRecommendation}>Try Again</PrimaryButton>
            <SecondaryButton onClick={backToPreferences}>Change Preferences</SecondaryButton>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Don&apos;t know what to watch?</h1>
        <p className="text-muted mb-8">
          We&apos;ll pick the best fit — not give you another list to scroll through.
        </p>
        <div className="space-y-7">
          <ChipGroup
            legend="Time"
            options={TIME_SELECTIONS.map((t) => ({ value: t, label: TIME_LABELS[t] }))}
            value={time}
            onChange={(v) => setTime(v as TimeSelection)}
          />
          <ChipGroup
            legend="Mood"
            options={[
              ...STANDARD_MOODS.map((m) => ({ value: m, label: MOOD_LABELS[m], hint: MOOD_HINTS[m] })),
              { value: "surprise_me", label: MOOD_LABELS.surprise_me, hint: "Let the system choose the vibe" },
            ]}
            value={mood}
            onChange={(v) => setMood(v as MoodChoice)}
          />
          <ChipGroup
            legend="Situation"
            options={SITUATION_SELECTIONS.map((s) => ({ value: s, label: SITUATION_LABELS[s] }))}
            value={situation}
            onChange={(v) => setSituation(v as SituationSelection)}
          />
          <div className="pt-2 flex items-center gap-4">
            <PrimaryButton onClick={fetchRecommendation} disabled={!time || !mood || !situation}>
              Help Me Pick
            </PrimaryButton>
            <SecondaryButton onClick={startOver}>Start Over</SecondaryButton>
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
