/// <reference path="../deno.d.ts" />
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

function tokenize(text: string) {
  return new Set(
    (text ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9+\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length >= 3)
      .slice(0, 5000),
  );
}

function scoreOverlap(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) {
    if (b.has(w)) hit++;
  }
  return Math.round((hit / Math.max(20, a.size)) * 100);
}

function label(score: number) {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "low";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const { user_id } = await req.json().catch(() => ({}));

    if (!user_id) {
      return json(
        { error: "user_id is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: pref, error: prefError } = await supabase
      .from("preferences")
      .select(`
        target_roles,
        target_skills,
        preferred_locations,
        remote_ok,
        onsite_ok,
        hybrid_ok,
        job_types,
        internship_types,
        preferred_sources,
        min_match_score,
        direct_apply_only,
        account_required_ok,
        automation_enabled
      `)
      .eq("user_id", user_id)
      .maybeSingle();

    if (prefError) throw prefError;

    const { data: activeResume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, file_name, original_text")
      .eq("user_id", user_id)
      .eq("is_primary", true)
      .maybeSingle();

    if (resumeError) throw resumeError;

    const resumeText = (activeResume?.original_text ?? "").slice(0, 20000);
    const resumeTokens = tokenize(resumeText);

    const roleTokens = tokenize((pref?.target_roles ?? []).join(" "));
    const skillTokens = tokenize((pref?.target_skills ?? []).join(" "));
    const locTokens = tokenize((pref?.preferred_locations ?? []).join(" "));

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company, location, description, opportunity_type, source_name")
      .order("posted_at", { ascending: false })
      .limit(300);

    if (jobsError) throw jobsError;

    const matches = (jobs ?? [])
      .filter((j: any) => {
        const preferredSources = pref?.preferred_sources ?? [];
        if (!preferredSources.length) return true;

        const src = (j.source_name ?? "").toLowerCase();
        return preferredSources.some((s: string) => s.toLowerCase() === src);
      })
      .filter((j: any) => {
        const jobTypes = pref?.job_types ?? [];
        const internshipTypes = pref?.internship_types ?? [];
        const wantsJobs = jobTypes.length > 0;
        const wantsInternships = internshipTypes.length > 0;

        if (!wantsJobs && !wantsInternships) return true;

        if (j.opportunity_type === "full-time") return wantsJobs;
        if (j.opportunity_type === "internship") return wantsInternships;

        return true;
      })
      .filter((j: any) => {
        const location = (j.location ?? "").toLowerCase();
        const preferredLocations = pref?.preferred_locations ?? [];

        if (!preferredLocations.length) return true;

        const hasRemoteWord = location.includes("remote");
        const remoteOk = pref?.remote_ok ?? false;
        const hybridOk = pref?.hybrid_ok ?? false;
        const onsiteOk = pref?.onsite_ok ?? false;

        if (hasRemoteWord && remoteOk) return true;

        const locationMatchesPreference = preferredLocations.some((loc: string) =>
          location.includes(loc.toLowerCase()),
        );

        if (locationMatchesPreference) return true;

        if (hybridOk || onsiteOk) return true;

        return false;
      })
      .map((j: any) => {
        const jobText = `${j.title ?? ""} ${j.company ?? ""} ${j.location ?? ""} ${j.description ?? ""}`.slice(
          0,
          20000,
        );

        const jobTokens = tokenize(jobText);
        const resumeScore = scoreOverlap(resumeTokens, jobTokens);
        const roleBoost = Math.min(15, scoreOverlap(roleTokens, jobTokens));
        const skillBoost = Math.min(15, scoreOverlap(skillTokens, jobTokens));
        const locBoost = Math.min(10, scoreOverlap(locTokens, jobTokens));

        const score = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              resumeScore * 0.6 + roleBoost * 0.15 + skillBoost * 0.15 + locBoost * 0.1,
            ),
          ),
        );

        return {
          user_id,
          job_id: j.id,
          match_score: score,
          fit_level: label(score),
          status: "scored"
        };
      });

    const { error: upsertError } = await supabase.from("job_matches").upsert(matches, {
      onConflict: "user_id,job_id",
      ignoreDuplicates: false,
    });

    if (upsertError) throw upsertError;

    const threshold =
      typeof pref?.min_match_score === "number" ? pref.min_match_score : 60;

    const eligible = matches.filter((m: any) => m.match_score >= threshold).length;

    return json(
      {
        scored: matches.length,
        eligible,
        threshold,
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    return json(
      { error: (e as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
});
