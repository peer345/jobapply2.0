import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const importanceVariant: Record<string, "error" | "warning" | "neutral"> = { high: "error", medium: "warning", low: "neutral" };

export default function ResumeOptimizerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: activeResume } = useQuery({
    queryKey: ["active-resume", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_name")
        .eq("user_id", user!.id)
        .eq("is_primary", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });

  const { data: jobOptions } = useQuery({
    queryKey: ["optimizer-job-options", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_matches")
        .select("match_score, jobs:jobs (id, title, company)")
        .eq("user_id", user!.id)
        .order("match_score", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 20_000,
  });

  const { data: latestOpt } = useQuery({
    queryKey: ["latest-optimization", user?.id, activeResume?.id],
    enabled: !!user?.id && !!activeResume?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_optimizations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("resume_id", activeResume!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });

  const optimizeMutation = useMutation({
    mutationFn: async (jobId?: string) => {
      const { data, error } = await supabase.functions.invoke("optimize-resume", {
        body: { user_id: user!.id, resume_id: activeResume!.id, job_id: jobId ?? null },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast({ title: "Optimization generated" });
      await qc.invalidateQueries({ queryKey: ["latest-optimization", user?.id, activeResume?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Optimization failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const s = latestOpt
    ? {
        summary: {
          original: "—",
          suggested: latestOpt.optimized_summary ?? "—",
          reason: "Generated based on your resume and the selected job.",
        },
        bulletRewrites: (latestOpt.rewritten_bullets ?? []) as any[],
        keywordGaps: (latestOpt.missing_keywords ?? []).map((k: string) => ({
          keyword: k,
          importance: "medium",
          suggestion: "Try weaving this keyword into relevant bullets.",
        })),
        skillsSuggestion: (latestOpt.missing_keywords ?? []) as string[],
      }
    : null;

  const jobsToShow =
    jobOptions && jobOptions.length
      ? jobOptions.map((r: any) => ({
          id: r.jobs?.id as string,
          title: r.jobs?.title as string,
          company: r.jobs?.company as string,
          matchPercent: r.match_score as number,
        }))
      : [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Optimizer</h1>
        <p className="text-sm text-muted-foreground">AI-powered suggestions to improve your resume</p>
      </div>

      {/* Job-specific */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Job-Specific Optimization</h3>
        <p className="text-sm text-muted-foreground mb-4">Select a job to generate a tailored resume version.</p>
        <p className="text-xs text-muted-foreground mb-3">
          Active resume: {activeResume?.file_name ?? "none"}{activeResume?.id ? "" : " (upload and set active in Resume Manager)"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobsToShow.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground">
              No jobs available yet. Fetch and score jobs on the Job Matches page first.
            </div>
          ) : jobsToShow.map(job => (
            <div key={job.id} className="flex items-center justify-between border border-border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.company} • {job.matchPercent}% match</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={!activeResume?.id || optimizeMutation.isPending}
                onClick={() => optimizeMutation.mutate(job.id)}
              >
                <Sparkles className="h-3 w-3" /> {optimizeMutation.isPending ? "Working..." : "Optimize"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Summary Improvement</h3>
        {s ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">ORIGINAL</p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">{s.summary.original}</div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-success">SUGGESTED</p>
                <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-sm">{s.summary.suggested}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">{s.summary.reason}</p>
            <Button size="sm" className="mt-3 gap-1"><CheckCircle2 className="h-3 w-3" /> Apply Suggestion</Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Generate an optimization to see suggestions.</p>
        )}
      </div>

      {/* Bullet Rewrites */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Bullet Point Rewrites</h3>
        <div className="space-y-4">
          {(s?.bulletRewrites ?? []).map((br, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">ORIGINAL</p>
                  <p className="text-sm bg-muted/50 rounded p-2">{br.original}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-success mb-1">SUGGESTED</p>
                  <p className="text-sm bg-success/5 border border-success/20 rounded p-2">{br.suggested}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">{br.reason}</p>
              <Button size="sm" variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Apply</Button>
            </div>
          ))}
          {!s && <p className="text-sm text-muted-foreground">No rewrites yet.</p>}
        </div>
      </div>

      {/* Keyword Gaps */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Keyword Gap Analysis</h3>
        <div className="space-y-3">
          {(s?.keywordGaps ?? []).map((kg) => (
            <div key={kg.keyword} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <StatusBadge variant={importanceVariant[kg.importance]}>{kg.importance}</StatusBadge>
                <span className="font-medium text-sm">{kg.keyword}</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs text-right">{kg.suggestion}</p>
            </div>
          ))}
          {!s && <p className="text-sm text-muted-foreground">No keyword gaps yet.</p>}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3">Suggested Skills Section</h3>
        <div className="flex flex-wrap gap-1.5">
          {(s?.skillsSuggestion ?? []).map(sk => (
            <StatusBadge key={sk} variant="direct">{sk}</StatusBadge>
          ))}
          {!s && <p className="text-sm text-muted-foreground">No skills suggested yet.</p>}
        </div>
      </div>
    </div>
  );
}
