import { checkSuggestRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { searchArtists } from "@/lib/external/spotifyClient";

// Below this, Spotify's own search tends to return noise rather than useful narrowing --
// matches the AutocompleteInput component's own default minChars, kept here too since the
// route is a real boundary (a scripted client could call it directly, bypassing the UI).
const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request);
  if (identifier) {
    const rateLimitResult = await checkSuggestRateLimit(identifier);
    if (!rateLimitResult.allowed) {
      const headers =
        rateLimitResult.retryAfterSeconds !== undefined
          ? { "Retry-After": String(rateLimitResult.retryAfterSeconds) }
          : undefined;
      return Response.json({ suggestions: [] }, { status: 429, headers });
    }
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json({ suggestions: [] });
  }

  const artists = await searchArtists(query);
  return Response.json({ suggestions: artists.map((artist) => artist.name) });
}
