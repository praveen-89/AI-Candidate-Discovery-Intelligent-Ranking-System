import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — used in "use client" components for
 * sign-in/sign-out and reading the current session's access token.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
