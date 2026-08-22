import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "./lib/supabase/config";

// Refreshes a logged-in user's Supabase session token on every request -- required because
// Server Components can read cookies but can't write them (see lib/supabase/server.ts's
// comment); without this running somewhere that CAN write cookies, a session would quietly
// go stale. Standard Supabase + Next.js App Router pattern, not something specific to this
// project's own design.
//
// Guarded on isSupabaseConfigured() so a checkout of this repo without Supabase env vars
// set (e.g. before Story 6.1's project exists, or a contributor who hasn't set it up
// locally) still serves every page normally -- this file runs on *every* request site-wide,
// so it must never be the thing that takes the whole app down for an unrelated feature.
//
// Named (and filed as) `proxy`, not `middleware`: Next.js 16 deprecated the `middleware.ts`
// convention in favor of `proxy.ts` (confirmed in this project's own installed Next.js
// docs, `node_modules/next/dist/docs/.../proxy.md` -- this app runs 16.2.10, past that
// change). Same file-runs-on-every-request behavior and cookie-handling APIs, just renamed.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  // getSupabaseUrl()/getSupabasePublishableKey(), not raw process.env -- these are the same
  // helpers client.ts/server.ts use, which trim and (the URL) strip trailing slashes. Using
  // raw env vars here would silently defeat that fix for this file specifically: a
  // trailing-slash URL would build a malformed double-slash request on every single
  // request, not just the one this project already hit live during setup.
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Triggers a token refresh if the current session is expired -- the *user* returned isn't
  // used here; pages/routes that need to know who's logged in call this again themselves
  // via lib/supabase/server.ts, which reads the (now-fresh) cookie. The SDK itself never
  // throws here (network/config failures are caught internally and returned as `error`
  // instead), which is what keeps this file safe to run unconditionally on every request --
  // but that same safety means a persistent failure (e.g. a misconfigured URL) would
  // otherwise refresh silently forever with zero visibility. Logged, not thrown: a broken
  // session refresh should never be what takes a page down.
  //
  // isAuthSessionMissingError specifically excluded: it's the completely normal result for
  // any logged-out visitor (i.e. currently every visitor, since Story 6.2's login UI doesn't
  // exist yet) -- confirmed live that logging it unconditionally spams this exact message on
  // every single anonymous request, which would drown out a genuinely rare, actionable
  // failure (the whole reason this logging was added) rather than surface it.
  const { error } = await supabase.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) {
    console.warn(`[proxy] Supabase session refresh failed: ${error.message}.`);
  }

  return response;
}

export const config = {
  // Runs on every route except static assets/images -- an auth session can matter on any
  // page (the nav's logged-in state, Story 6.5, shows on all of them), not just account
  // pages specifically.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
