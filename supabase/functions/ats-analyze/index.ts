import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdminClient, json } from "../_shared/supabase.ts";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hashScore(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const { user_id, resume_id } = await req.json().catch(() => ({}));
    if (!user_id || !resume_id) {
      return json({ error: "user_id and resume_id are required" }, { status: 400, headers: corsHeaders });
    }

    const supabase = getSupabaseAdminClient();

    const { data: resume, error: resumeErr } = await supabase
      .from("resumes")
      .select("id, file_name")
      .eq("id", resume_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (resumeErr) throw resumeErr;
    if (!resume) return json({ error: "Resume not found" }, { status: 404, headers: corsHeaders });

    // If your schema includes parsed content for resumes, wire it in here.
    const text = "".slice(0, 20000);
    const base = text ? (hashScore(text) % 35) + 60 : 55;

    const formatting = clamp(base + 10);
    const keywords = clamp(base - 8);
    const readability = clamp(base + 5);
    const completeness = clamp(base + 2);
    const relevance = clamp(base - 3);
    const overall = clamp((formatting + keywords + readability + completeness + relevance) / 5);

    const issues = [
      { severity: keywords < 70 ? "high" : "medium", category: "Keywords", message: "Consider adding more role-specific keywords." },
      { severity: "medium", category: "Content", message: "Quantify impact with metrics in experience bullet points." },
      { severity: "low", category: "Formatting", message: "Ensure links (LinkedIn/portfolio) are clearly visible." },
    ];
    const suggestions = [
      "Add quantified metrics to key achievements.",
      "Include 5–10 keywords from target job descriptions.",
      "Improve section headings consistency (Experience, Projects, Skills).",
    ];

    const { data: report, error: upsertErr } = await supabase
      .from("ats_reports")
      .insert({
        user_id,
        resume_id,
        overall_score: overall,
        formatting_score: formatting,
        keyword_score: keywords,
        readability_score: readability,
        section_completeness_score: completeness,
        role_relevance_score: relevance,
        issues,
        suggestions,
      })
      .select("*")
      .single();
    if (upsertErr) throw upsertErr;

    await supabase.from("resumes").update({ ats_score: overall }).eq("id", resume_id).eq("user_id", user_id);

    return json({ report }, { headers: corsHeaders });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});

