import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const { user_id } = await req.json().catch(() => ({}));
    if (!user_id) return json({ error: "user_id is required" }, { status: 400, headers: corsHeaders });

    const supabase = getSupabaseAdminClient();

    const [{ count: jobsCount }, { count: internshipsCount }] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("opportunity_type", "full-time"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("opportunity_type", "internship"),
    ]);

    const [{ count: applicationsCount }, { count: failedCount }] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user_id).eq("status", "failed"),
    ]);

    const { data: avgMatchRows } = await supabase
      .from("job_matches")
      .select("match_score")
      .eq("user_id", user_id)
      .limit(500);
    const avgMatch =
      avgMatchRows && avgMatchRows.length
        ? Math.round(avgMatchRows.reduce((s, r) => s + (r.match_score ?? 0), 0) / avgMatchRows.length)
        : 0;

    const { data: eligibleRows } = await supabase
      .from("job_matches")
      .select("id, match_score")
      .eq("user_id", user_id)
      .gte("match_score", 60);

    return json(
      {
        jobsCount: jobsCount ?? 0,
        internshipsCount: internshipsCount ?? 0,
        applicationsCount: applicationsCount ?? 0,
        failedCount: failedCount ?? 0,
        avgMatchScore: avgMatch,
        eligibleOpportunities: eligibleRows?.length ?? 0,
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});

