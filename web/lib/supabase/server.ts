import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

// For use in Server Components, Route Handlers, and Server Actions. Same "throws if not
// configured" contract as client.ts -- see its comment.
//
// A Server Component can read cookies but can't set them (Next.js restriction), so the
// `setAll` write can fail there -- caught and ignored deliberately: session *refresh*
// (writing an updated token back) happens in middleware.ts on every request, which can set
// cookies. A plain read-only Server Component render doesn't need to also succeed at
// writing; middleware already covers it.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Expected when called from a Server Component render -- see comment above.
        }
      },
    },
  });
}
