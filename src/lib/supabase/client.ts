import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let instance: SupabaseClient | null = null;

export function createClient() {
  if (!instance) {
    instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Bypass the Web Lock API — the singleton already prevents concurrent
          // token refreshes, and competing locks across rapid reloads cause the
          // auth state to hang indefinitely after ~5 reloads.
          lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => fn(),
        },
      }
    );
  }
  return instance;
}