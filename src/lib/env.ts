export function requirePublicEnv(...keys: string[]) {
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const k of keys) {
    // Vite only reliably injects env vars accessed via static property reads.
    // This helper is kept for non-critical uses; prefer explicit reads for known keys.
    const fromVite = (import.meta as any)?.env?.[k];
    const fromProcess = (globalThis as any)?.process?.env?.[k];
    const v = (fromVite ?? fromProcess) as string | undefined;
    if (!v) missing.push(k);
    else out[k] = v;
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", ",
      )}. Add them to your .env (Vite supports VITE_*) or hosting provider env settings.`,
    );
  }

  return out as Record<(typeof keys)[number], string>;
}

export function getSupabasePublicConfig() {
  // Support both the user's requested NEXT_PUBLIC_* names and Vite's VITE_* convention.
  const viteEnv = (import.meta as any)?.env ?? {};
  const url =
    (viteEnv.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ??
    (viteEnv.VITE_SUPABASE_URL as string | undefined) ??
    ((globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ??
    ((globalThis as any)?.process?.env?.VITE_SUPABASE_URL as string | undefined) ??
    "";
  const anonKey =
    (viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
    (viteEnv.VITE_SUPABASE_ANON_KEY as string | undefined) ??
    ((globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
    ((globalThis as any)?.process?.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ??
    "";

  return { url, anonKey };
}

