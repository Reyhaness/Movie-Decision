import { prisma } from "./prisma";
import type { EventType, TimePreference, MoodPreference, SituationPreference } from "@prisma/client";
import type { RecommendationInput } from "@/lib/validation";

const ANON_COOKIE = "mda_anonymous_id";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export interface SessionCookiePayload {
  name: string;
  value: string;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
}

export interface SessionResolution {
  anonymousUserId: string;
  setCookie: SessionCookiePayload;
}

// Anonymous guest identity: server-generated id in an HTTP-only cookie,
// 30-day rolling expiry (approved default #2). Client cannot set this id.
export async function resolveAnonymousUser(
  cookieId: string | undefined
): Promise<SessionResolution> {
  let id = cookieId;
  if (id) {
    const existing = await prisma.anonymousUser.findUnique({ where: { id } });
    if (!existing) id = undefined;
  }
  if (!id) {
    const created = await prisma.anonymousUser.create({ data: {} });
    id = created.id;
  }
  await prisma.anonymousUser.update({
    where: { id },
    data: { lastSeenAt: new Date() },
  });
  return {
    anonymousUserId: id,
    setCookie: {
      name: ANON_COOKIE,
      value: id,
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export async function recordEvent(params: {
  anonymousUserId: string;
  eventType: EventType;
  sessionId?: string | null;
  movieId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.event.create({
    data: {
      anonymousUserId: params.anonymousUserId,
      eventType: params.eventType,
      sessionId: params.sessionId ?? null,
      movieId: params.movieId ?? null,
      metadata: (params.metadata ?? null) as never,
    },
  });
}

// Wire-format (domain) values map 1:1 to Prisma enum members except time,
// where Prisma forbids a leading digit: "90_to_120" <-> "time_90_120".
const DB_TIME: Record<RecommendationInput["time"], TimePreference> = {
  under_90: "under_90",
  "90_to_120": "time_90_120",
  over_120: "over_120",
};

export async function startSession(
  input: RecommendationInput,
  anonymousUserId: string
) {
  const session = await prisma.recommendationSession.create({
    data: {
      anonymousUserId,
      timePreference: DB_TIME[input.time],
      moodPreference: input.mood as MoodPreference,
      situationPreference: input.situation as SituationPreference,
    },
  });
  await recordEvent({
    anonymousUserId,
    eventType: "session_started",
    sessionId: session.id,
  });
  return session;
}

export async function getSessionExclusions(
  sessionId: string,
  anonymousUserId: string
): Promise<string[]> {
  const session = await prisma.recommendationSession.findFirst({
    where: { id: sessionId, anonymousUserId },
    include: { attempts: { select: { movieId: true } } },
  });
  if (!session) return [];
  return session.attempts.map((a) => a.movieId);
}

export async function recordAttempt(params: {
  sessionId: string;
  movieId: string;
  attemptNumber: number;
  moodScore: number | null;
  situationScore: number;
  distance: number;
}): Promise<{ id: string } | null> {
  const session = await prisma.recommendationSession.findFirst({
    where: { id: params.sessionId },
    select: { id: true },
  });
  if (!session) return null;
  const created = await prisma.recommendationAttempt.create({
    data: {
      sessionId: session.id,
      movieId: params.movieId,
      attemptNumber: params.attemptNumber,
      moodScore: params.moodScore,
      situationScore: params.situationScore,
      distance: params.distance,
      accepted: false,
    },
  });
  return { id: created.id };
}

// "This works" = explicit acceptance (approved decision #6); distinct from watchlist.
export async function acceptAttempt(sessionId: string, movieId: string): Promise<boolean> {
  const updated = await prisma.recommendationAttempt.updateMany({
    where: { sessionId, movieId },
    data: { accepted: true },
  });
  return updated.count > 0;
}

export async function completeSession(sessionId: string): Promise<void> {
  const existing = await prisma.recommendationSession.findFirst({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.recommendationSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
  });
}
