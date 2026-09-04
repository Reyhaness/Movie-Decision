import { NextRequest, NextResponse } from "next/server";
import { resolveAnonymousUser, recordEvent, acceptAttempt, completeSession } from "@/services/database/sessions";
import { prisma } from "@/services/database/prisma";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }
  const { sessionId, movieId } = body as { sessionId?: unknown; movieId?: unknown };
  if (typeof sessionId !== "string" || typeof movieId !== "string" || !sessionId || !movieId) {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }

  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);

    const session = await prisma.recommendationSession.findFirst({
      where: { id: sessionId, anonymousUserId },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json({ status: "invalid_input" }, { status: 400 });
    }

    await acceptAttempt(sessionId, movieId);
    await completeSession(sessionId);
    await recordEvent({
      anonymousUserId,
      eventType: "movie_accepted",
      sessionId,
      movieId,
    });

    const response = NextResponse.json({ status: "accepted" });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/accept]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}
