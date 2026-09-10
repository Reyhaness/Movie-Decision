import { NextRequest, NextResponse } from "next/server";
import { resolveAnonymousUser } from "@/services/database/sessions";
import { removeFromWatchlist } from "@/services/database/watchlist";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ movieId: string }> }
) {
  const { movieId } = await context.params;
  if (!movieId) {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }

  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);
    const removed = await removeFromWatchlist(anonymousUserId, decodeURIComponent(movieId));
    const response = NextResponse.json({ status: "success", removed });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/watchlist DELETE]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}
