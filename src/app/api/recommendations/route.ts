import { NextRequest, NextResponse } from "next/server";
import { recommendationInputSchema } from "@/lib/validation";
import { recommendMovie } from "@/services/recommendation";
import { loadActiveCandidates, loadMoviePayload } from "@/services/database/movies";
import { prisma } from "@/services/database/prisma";
import {
  resolveAnonymousUser,
  startSession,
  recordEvent,
  recordAttempt,
  getSessionExclusions,
} from "@/services/database/sessions";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }

  const parsed = recommendationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }
  const input = parsed.data;
  const clientExcluded = Array.isArray((body as { excludedMovieIds?: unknown }).excludedMovieIds)
    ? ((body as { excludedMovieIds: string[] }).excludedMovieIds).filter((id) => typeof id === "string")
    : [];
  const clientSessionId =
    typeof (body as { sessionId?: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId
      : undefined;

  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);

    let sessionId: string | undefined = clientSessionId;
    if (sessionId) {
      const known = await prismaSessionExists(sessionId, anonymousUserId);
      if (!known) sessionId = undefined;
    }
    if (!sessionId) {
      const session = await startSession(input, anonymousUserId);
      sessionId = session.id;
    }

    await recordEvent({
      anonymousUserId,
      eventType: "preferences_submitted",
      sessionId,
      metadata: { time: input.time, mood: input.mood, situation: input.situation },
    });

    const serverExcluded = await getSessionExclusions(sessionId, anonymousUserId);
    const excludedMovieIds = [...new Set([...clientExcluded, ...serverExcluded])];

    const candidates = await loadActiveCandidates();
    const result = recommendMovie({ input, candidates, excludedMovieIds });

    if (result.status === "success" && result.movie && result.fit) {
      await recordAttempt({
        sessionId,
        movieId: result.movie.movieId,
        attemptNumber: excludedMovieIds.length + 1,
        moodScore: result.fit.moodScore,
        situationScore: result.fit.situationScore,
        distance: result.fit.distance,
      });
      const payload = await loadMoviePayload(result.movie.movieId);
      await recordEvent({
        anonymousUserId,
        eventType: "recommendation_shown",
        sessionId,
        movieId: result.movie.movieId,
        metadata: {
          time: input.time,
          mood: input.mood,
          situation: input.situation,
          distance: result.fit.distance,
          excludedCount: excludedMovieIds.length,
        },
      });
      const response = NextResponse.json({
        status: "success",
        sessionId,
        context: { time: input.time, mood: input.mood, situation: input.situation },
        movie: payload,
      });
      response.cookies.set(setCookie);
      return response;
    }

    await recordEvent({
      anonymousUserId,
      eventType: "preferences_submitted",
      sessionId,
      metadata: { time: input.time, mood: input.mood, situation: input.situation, engineStatus: result.status },
    });
    const response = NextResponse.json({
      status: result.status,
      sessionId,
      reason: result.reason,
    });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/recommendations]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}

async function prismaSessionExists(
  sessionId: string,
  anonymousUserId: string
): Promise<boolean> {
  const session = await prisma.recommendationSession.findFirst({
    where: { id: sessionId, anonymousUserId },
    select: { id: true },
  });
  return session !== null;
}
