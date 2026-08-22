import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

// For use in Client Components only ("use client" files) -- e.g. the login form (Story
// 6.2) and the results page's Save button (Story 6.3). Throws if Supabase isn't configured
// yet; callers in a real user-facing flow are expected to only run once it is (unlike the
// optional/best-effort external clients elsewhere in this project, an account feature that
// silently no-ops isn't a coherent UX -- check isSupabaseConfigured() at a higher level,
// e.g. to hide the "Sign in" entry point entirely, rather than deep inside this call).
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
