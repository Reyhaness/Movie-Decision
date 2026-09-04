import { NextRequest, NextResponse } from "next/server";
import { resolveAnonymousUser, recordEvent } from "@/services/database/sessions";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }
  const { eventType, sessionId, movieId, metadata } = body as {
    eventType?: unknown;
    sessionId?: unknown;
    movieId?: unknown;
    metadata?: unknown;
  };

  const ALLOWED = [
    "session_started",
    "preferences_submitted",
    "recommendation_shown",
    "movie_accepted",
    "try_another",
    "watchlist_added",
  ] as const;
  type AllowedEvent = (typeof ALLOWED)[number];

  if (typeof eventType !== "string" || !ALLOWED.includes(eventType as AllowedEvent)) {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }

  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);
    await recordEvent({
      anonymousUserId,
      eventType: eventType as AllowedEvent,
      sessionId: typeof sessionId === "string" ? sessionId : null,
      movieId: typeof movieId === "string" ? movieId : null,
      metadata: metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : undefined,
    });
    const response = NextResponse.json({ status: "recorded" });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/events]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}
