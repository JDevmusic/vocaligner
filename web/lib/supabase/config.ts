// Shared "is Supabase configured" check, same pattern as lib/store/upstashConfig.ts's
// isUpstashConfigured() -- both env vars are NEXT_PUBLIC_* (safe to expose to the browser;
// Supabase's publishable key is designed to be public, real access control lives in Row
// Level Security policies on each table, not in keeping this key secret) but still optional
// during local dev before a real Supabase project exists.
//
// Named "publishable key" (Supabase's current dashboard terminology, Settings -> API Keys),
// not "anon key" -- the older name for the same kind of key, still used in some
// docs/tutorials elsewhere but no longer what a new project's dashboard actually shows.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

// Strips any trailing slash(es) -- a URL copy-pasted with one (a real, easy mistake; this
// exact bug was hit live during Story 6.1 setup) would otherwise produce a double slash
// once a caller appends a path (e.g. `${url}/rest/v1/saved_songs`), which PostgREST rejects
// outright as an invalid path (error PGRST125) rather than just ignoring the extra slash.
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url?.trim()) {
    throw new Error("[supabase] NEXT_PUBLIC_SUPABASE_URL is not configured. Check isSupabaseConfigured() first.");
  }
  return url.trim().replace(/\/+$/, "");
}

export function getSupabasePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured. Check isSupabaseConfigured() first."
    );
  }
  // Trimmed on return, not just for the truthiness check above -- incidental
  // leading/trailing whitespace from a copy-paste would otherwise reach an Authorization
  // header as-is, same class of subtle paste mistake getSupabaseUrl() already guards
  // against for the URL.
  return key.trim();
}
