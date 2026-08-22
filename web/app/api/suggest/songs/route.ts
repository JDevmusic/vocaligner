import { waitUntil } from "@vercel/functions";
import { checkSuggestRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { searchTracksByArtist } from "@/lib/external/spotifyClient";

// Song search is already scoped to a specific artist (see searchTracksByArtist), so even
// a single character meaningfully narrows the result -- unlike artist search, which has no
// such scoping and needs a longer minimum to avoid noise.
const MIN_QUERY_LENGTH = 1;

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request);
  if (identifier) {
    const rateLimitResult = await checkSuggestRateLimit(identifier);
    if (rateLimitResult.pending) waitUntil(rateLimitResult.pending);
    if (!rateLimitResult.allowed) {
      const headers =
        rateLimitResult.retryAfterSeconds !== undefined
          ? { "Retry-After": String(rateLimitResult.retryAfterSeconds) }
          : undefined;
      return Response.json({ suggestions: [] }, { status: 429, headers });
    }
  }

  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist")?.trim() ?? "";
  const query = searchParams.get("q")?.trim() ?? "";
  if (!artist || query.length < MIN_QUERY_LENGTH) {
    return Response.json({ suggestions: [] });
  }

  const suggestions = await searchTracksByArtist(artist, query);
  return Response.json({ suggestions });
}
