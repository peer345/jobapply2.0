import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

function tokenize(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 5000),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const { user_id, resume_id, job_id } = await req.json().catch(() => ({}));
    if (!user_id || !resume_id) {
      return json({ error: "user_id and resume_id are required" }, { status: 400, headers: corsHeaders });
    }

    const supabase = getSupabaseAdminClient();

    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resume_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (!resume) return json({ error: "Resume not found" }, { status: 404, headers: corsHeaders });

    const { data: job } = job_id
      ? await supabase.from("jobs").select("id, title, company, description").eq("id", job_id).maybeSingle()
      : { data: null as any };

    const resumeTokens = tokenize("");
    const jobTokens = tokenize(`${job?.title ?? ""} ${job?.company ?? ""} ${job?.description ?? ""}`.slice(0, 20000));

    const missing = Array.from(jobTokens).filter((w) => !resumeTokens.has(w)).slice(0, 15);

    const optimized_summary = job
      ? `Results-driven candidate aligned to ${job.title} at ${job.company}. Strengthen relevance by highlighting experience with ${missing.slice(0, 5).join(", ")}.`
      : "Results-driven candidate. Strengthen relevance by tailoring keywords to the target role.";

    const rewritten_bullets = [
      {
        original: "Built features for the product.",
        suggested: "Shipped user-facing features end-to-end, improving performance and UX with measurable impact.",
        reason: "Adds ownership and measurable outcomes.",
      },
      {
        original: "Worked with APIs and backend services.",
        suggested: "Designed and integrated API workflows with robust error handling and monitoring, reducing failure rates.",
        reason: "Highlights reliability and engineering maturity.",
      },
    ];

    const section_suggestions = [
      { section: "Summary", tip: "Add role-specific keywords and quantified impact in 1–2 sentences." },
      { section: "Experience", tip: "Start bullets with action verbs and include numbers (%, $, users, latency)." },
      { section: "Skills", tip: "Group skills by category (Frontend, Backend, Cloud) and match job requirements." },
    ];

    const improvement_tips = [
      "Mirror 5–10 keywords from the job description naturally.",
      "Add one bullet that demonstrates scope (scale, stakeholders, complexity).",
      "Ensure ATS-friendly formatting (no tables/images for key content).",
    ];

    const { data: opt, error } = await supabase
      .from("resume_optimizations")
      .insert({
        user_id,
        resume_id,
        job_id: job_id ?? null,
        optimized_summary,
        missing_keywords: missing,
        rewritten_bullets,
        section_suggestions,
        improvement_tips,
      })
      .select("*")
      .single();
    if (error) throw error;

    return json({ optimization: opt }, { headers: corsHeaders });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});

