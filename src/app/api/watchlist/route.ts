import { NextRequest, NextResponse } from "next/server";
import { resolveAnonymousUser } from "@/services/database/sessions";
import { getWatchlist, addToWatchlist } from "@/services/database/watchlist";

export async function GET(request: NextRequest) {
  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);
    const items = await getWatchlist(anonymousUserId);
    const response = NextResponse.json({ status: "success", items });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/watchlist GET]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }
  const movieId = (body as { movieId?: unknown }).movieId;
  if (typeof movieId !== "string" || movieId.length === 0) {
    return NextResponse.json({ status: "invalid_input" }, { status: 400 });
  }

  try {
    const rawCookie = request.cookies.get("mda_anonymous_id")?.value;
    const { anonymousUserId, setCookie } = await resolveAnonymousUser(rawCookie);
    const result = await addToWatchlist(anonymousUserId, movieId);
    if (!result.ok) {
      return NextResponse.json({ status: "movie_not_found" }, { status: 404 });
    }
    const response = NextResponse.json({
      status: "success",
      alreadySaved: result.alreadySaved,
    });
    response.cookies.set(setCookie);
    return response;
  } catch (error) {
    console.error("[api/watchlist POST]", error);
    return NextResponse.json({ status: "service_error" }, { status: 500 });
  }
}
