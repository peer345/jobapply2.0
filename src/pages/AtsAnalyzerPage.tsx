import { MatchRing } from "@/components/ui/MatchRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const severityIcon = { high: AlertTriangle, medium: Info, low: Info };
const severityColor = { high: "text-destructive", medium: "text-warning", low: "text-muted-foreground" };
const severityBadge: Record<string, "error" | "warning" | "neutral"> = { high: "error", medium: "warning", low: "neutral" };

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export default function AtsAnalyzerPage() {
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

  const { data: latestReport } = useQuery({
    queryKey: ["ats-latest", user?.id, activeResume?.id],
    enabled: !!user?.id && !!activeResume?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ats_reports")
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

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ats-analyze", {
        body: { user_id: user!.id, resume_id: activeResume!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast({ title: "ATS report generated" });
      await qc.invalidateQueries({ queryKey: ["ats-latest", user?.id, activeResume?.id] });
      await qc.invalidateQueries({ queryKey: ["resumes", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "ATS analysis failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const a = latestReport
    ? {
        overall: latestReport.overall_score,
        formatting: latestReport.formatting_score ?? 0,
        keywords: latestReport.keyword_score ?? 0,
        readability: latestReport.readability_score ?? 0,
        sectionCompleteness: latestReport.section_completeness_score ?? 0,
        roleRelevance: latestReport.role_relevance_score ?? 0,
        issues: (latestReport.issues ?? []) as any[],
        topMissingKeywords: [],
        improvements: ((latestReport.suggestions ?? []) as any[]).map((s) => (typeof s === "string" ? s : JSON.stringify(s))),
      }
    : null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ATS Analyzer</h1>
        <p className="text-sm text-muted-foreground">Understand how ATS systems see your resume</p>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div>
          <p className="text-sm font-medium">Resume</p>
          <p className="text-xs text-muted-foreground">
            {activeResume?.file_name ? activeResume.file_name : "No active resume yet. Upload one in Resume Manager."}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          disabled={!activeResume?.id || analyzeMutation.isPending}
          onClick={() => analyzeMutation.mutate()}
        >
          <Sparkles className="h-4 w-4" />
          {analyzeMutation.isPending ? "Analyzing..." : latestReport ? "Re-analyze" : "Generate report"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <MatchRing value={a?.overall ?? 0} size={120} strokeWidth={8} />
          <h3 className="font-bold text-lg mt-3">Overall ATS Score</h3>
          <p className="text-sm text-muted-foreground">Based on formatting, keywords, and structure</p>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Score Breakdown</h3>
          {a ? (
            <>
              <ScoreBar label="Formatting" value={a.formatting} />
              <ScoreBar label="Keywords" value={a.keywords} />
              <ScoreBar label="Readability" value={a.readability} />
              <ScoreBar label="Section Completeness" value={a.sectionCompleteness} />
              <ScoreBar label="Role Relevance" value={a.roleRelevance} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Generate an ATS report to see your breakdown.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Issues Found</h3>
          <div className="space-y-3">
            {(a?.issues ?? []).map((issue, i) => {
              const Icon = severityIcon[issue.severity];
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${severityColor[issue.severity]}`} />
                  <div className="flex-1">
                    <p className="text-sm">{issue.message}</p>
                    <StatusBadge variant={severityBadge[issue.severity]} className="mt-1">{issue.category} • {issue.severity}</StatusBadge>
                  </div>
                </div>
              );
            })}
            {!a && <p className="text-sm text-muted-foreground">No report yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">Top Missing Keywords</h3>
            <div className="flex flex-wrap gap-1.5">
              {(a?.topMissingKeywords ?? []).map(kw => <StatusBadge key={kw} variant="warning">{kw}</StatusBadge>)}
              {!a && <p className="text-sm text-muted-foreground">Generate a report to see keyword gaps.</p>}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">Priority Improvements</h3>
            <div className="space-y-2">
              {(a?.improvements ?? []).map((imp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{imp}</p>
                </div>
              ))}
              {!a && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
