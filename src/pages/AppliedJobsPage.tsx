import { StatusBadge } from "@/components/ui/StatusBadge";
import { MatchRing } from "@/components/ui/MatchRing";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

const statusVariant: Record<string, "success" | "error" | "warning" | "direct" | "neutral"> = {
  applied: "success", failed: "error", under_review: "warning", interview: "direct", rejected: "neutral",
};
const statusLabel: Record<string, string> = {
  applied: "Applied", failed: "Failed", under_review: "Under Review", interview: "Interview", rejected: "Rejected",
};

export default function AppliedJobsPage() {
  const { user } = useAuth();

  const { data: realApps, isLoading } = useQuery({
    queryKey: ["applications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, applied_at, platform, jobs:jobs (title, company, source_name, opportunity_type), job_matches:job_matches (match_score)")
        .eq("user_id", user!.id)
        .order("applied_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        id: r.id,
        company: r.jobs?.company ?? "Unknown company",
        role: r.jobs?.title ?? "Untitled role",
        source: r.jobs?.source_name ?? r.platform ?? "—",
        type: (r.jobs?.opportunity_type ?? "full-time") as any,
        matchPercent: Array.isArray(r.job_matches) ? (r.job_matches[0]?.match_score ?? 0) : (r.job_matches?.match_score ?? 0),
        appliedDate: r.applied_at ? new Date(r.applied_at).toLocaleDateString() : "—",
        status: r.status,
      }));
    },
    staleTime: 10_000,
  });

  const list = (realApps ?? []) as any[];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applied Jobs</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading applications..." : `${list.length} applications tracked`}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-7 gap-4 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Company / Role</span><span>Source</span><span>Type</span><span>Match</span><span>Applied</span><span>Status</span><span>Actions</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="font-medium">Loading…</p>
            <p className="text-sm">Fetching your application history.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="font-medium">No applications yet</p>
            <p className="text-sm">Once you apply, your history will show up here.</p>
          </div>
        ) : (
          list.map((job: any) => (
            <div key={job.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 items-center p-4 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">{job.role}</p>
                <p className="text-xs text-muted-foreground">{job.company}</p>
              </div>
              <span className="text-sm">{job.source}</span>
              <StatusBadge variant={job.type === "internship" ? "internship" : "job"}>
                {job.type === "internship" ? "Internship" : "Full-time"}
              </StatusBadge>
              <MatchRing value={job.matchPercent} size={36} strokeWidth={3} />
              <span className="text-xs text-muted-foreground">{job.appliedDate}</span>
              <StatusBadge variant={statusVariant[job.status]}>{statusLabel[job.status]}</StatusBadge>
              <Button variant="ghost" size="sm" className="gap-1 w-fit"><Eye className="h-3 w-3" /> Details</Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
