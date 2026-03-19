/// <reference path="../deno.d.ts" />
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

function normalize(s: string) {
  return (s ?? "").trim().toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const { user_id } = await req.json().catch(() => ({}));
    if (!user_id) return json({ error: "user_id is required" }, { status: 400, headers: corsHeaders });

    const supabase = getSupabaseAdminClient();

    const { data: pref } = await supabase
      .from("preferences")
      .select("min_match_score, automation_enabled, direct_apply_only, account_required_ok")
      .eq("user_id", user_id)
      .maybeSingle();

    if (pref?.automation_enabled === false) {
      return json({ queued: 0, reason: "automation_disabled" }, { headers: corsHeaders });
    }

    const threshold = typeof pref?.min_match_score === "number" ? pref.min_match_score : 60;
    const dailyLimit = 20; 

    const { data: sourceCaps } = await supabase.from("source_capabilities").select("source_name, auto_apply_supported, requires_connected_account");
    const capsBySource = new Map<string, { auto_apply_supported: boolean; requires_connected_account: boolean }>();
    (sourceCaps ?? []).forEach((r: any) => capsBySource.set(normalize((r as any).source_name), r));

    const { data: connected } = await supabase
      .from("connected_sources")
      .select("source_name, is_connected")
      .eq("user_id", user_id);
    const connectedBySource = new Map<string, boolean>();
    (connected ?? []).forEach((r: any) => connectedBySource.set(normalize((r as any).source_name), !!r.is_connected));

    const { data: alreadyApplied } = await supabase
      .from("applications")
      .select("job_id")
      .eq("user_id", user_id);
    const appliedSet = new Set((alreadyApplied ?? []).map((a: any) => a.job_id));

    const { data: candidates } = await supabase
      .from("job_matches")
      .select("job_id, match_score, jobs:jobs!inner(source_name, company)")
      .eq("user_id", user_id)
      .gte("match_score", threshold)
      .order("match_score", { ascending: false })
      .limit(300);

    const queue: Array<{ user_id: string; job_id: string; priority: number; status: string }> = [];

    for (const c of (candidates ?? []) as any[]) {
      const jobId = c.job_id as string;
      if (appliedSet.has(jobId)) continue;

      const job = (c as any).jobs;
      const source = normalize(job?.source_name ?? "");
      const caps = capsBySource.get(source);

      // Skip if source is not capable of auto-apply when direct_apply_only is enabled.
      if (pref?.direct_apply_only) {
        if (!caps?.auto_apply_supported) continue;
      }

      // Skip if a connected account is required but preference says no, OR it's not connected.
      if (caps?.requires_connected_account) {
        if (!pref?.account_required_ok) continue;
        const isConnected = connectedBySource.get(source) ?? false;
        if (!isConnected) continue;
      }

      // Only queue sources that are at least fetch-supported; auto-apply can still be false (queued for later).
      queue.push({
        user_id,
        job_id: jobId,
        priority: Math.max(1, 100 - (c.match_score ?? 0)),
        status: caps?.auto_apply_supported ? "queued" : "needs_account",
      });

      if (queue.length >= dailyLimit) break;
    }

    if (!queue.length) return json({ queued: 0 }, { headers: corsHeaders });

    const { error } = await supabase.from("queue_items").upsert(queue, {
      onConflict: "user_id,job_id",
      ignoreDuplicates: false,
    });
    if (error) throw error;

    return json({ queued: queue.length }, { headers: corsHeaders });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
