import { createClient } from "@supabase/supabase-js";

// Vite reliably injects env vars accessed via static property reads.
const viteEnv = (import.meta as any).env ?? {};
const url =
  (viteEnv.VITE_SUPABASE_URL as string | undefined) ??
  (viteEnv.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ??
  "";
const anonKey =
  (viteEnv.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  "";

const safeUrl = url || "http://localhost:54321";
const safeAnonKey = anonKey || "public-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (!url || !anonKey) {
  // Keep UI running even if env isn't configured yet.
  // Supabase calls will fail with auth/network errors until keys are provided.
  console.warn(
    "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_* equivalents).",
  );
} else {
  console.info(`[Supabase] Using URL: ${safeUrl}`);
}
