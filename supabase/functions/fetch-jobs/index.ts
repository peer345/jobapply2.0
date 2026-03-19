/// <reference path="../deno.d.ts" />
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const { user_id, limit = 50 } = await req.json().catch(() => ({}));
    if (!user_id) return json({ error: "user_id is required" }, { status: 400, headers: corsHeaders });

    const supabase = getSupabaseAdminClient();
    const adzunaId = Deno.env.get("ADZUNA_APP_ID");
    const adzunaKey = Deno.env.get("ADZUNA_APP_KEY");

    const { data: pref, error: prefError } = await supabase
      .from("preferences")
      .select("target_roles, preferred_locations")
      .eq("user_id", user_id)
      .maybeSingle();

    if (prefError) throw prefError;

    const roles = pref?.target_roles?.length ? pref.target_roles : ["Software Engineer"];
    const locations = pref?.preferred_locations?.length ? pref.preferred_locations : ["London"];
    const country = "gb"; 

    let allJobs: any[] = [];

    if (adzunaId && adzunaKey) {
      console.log(`[fetch-jobs] Fetching from Adzuna for ${user_id}...`);
      
      const role = roles[0];
      const loc = locations[0];
      
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=${limit}&what=${encodeURIComponent(role)}&where=${encodeURIComponent(loc)}&content-type=application/json`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        
        allJobs = results.map((j: any) => ({
          source_name: "adzuna",
          external_job_id: String(j.id),
          title: j.title || "Untitled",
          company: j.company?.display_name || "Unknown",
          location: j.location?.display_name || "",
          description: j.description || "",
          apply_url: j.redirect_url || "",
          posted_at: j.created || new Date().toISOString(),
          raw_data: j
        }));
      } else {
        console.error("[fetch-jobs] Adzuna API failed:", await res.text());
      }
    }

    if (allJobs.length === 0) {
      return json({ inserted: 0, message: "No jobs fetched." }, { headers: corsHeaders });
    }

    const { data, error: upsertError } = await supabase
      .from("jobs")
      .upsert(allJobs, { 
        onConflict: "source_name,external_job_id",
        ignoreDuplicates: false 
      })
      .select("id");

    if (upsertError) throw upsertError;

    return json({ inserted: data?.length ?? 0 }, { headers: corsHeaders });
  } catch (e) {
    console.error("[fetch-jobs] Error:", e);
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
