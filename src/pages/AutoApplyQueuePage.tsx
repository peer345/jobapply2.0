import { useState } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MatchRing } from "@/components/ui/MatchRing";
import { Zap, Pause, Play, GripVertical, Info } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const statusVariant: Record<string, "processing" | "neutral" | "success" | "error" | "warning"> = {
  queued: "neutral", processing: "processing", applied: "success", failed: "error", skipped: "neutral", needs_account: "warning",
};

export default function AutoApplyQueuePage() {
  const [paused, setPaused] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: realQueue } = useQuery({
    queryKey: ["queue", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("queue_items")
        .select("id, status, priority, jobs:jobs (title, company, source_name, opportunity_type), job_matches:job_matches (match_score)")
        .eq("user_id", user!.id)
        .order("priority", { ascending: true })
        .limit(200);
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        id: r.id as string,
        jobTitle: r.jobs?.title ?? "Untitled role",
        company: r.jobs?.company ?? "Unknown company",
        matchPercent: r.job_matches?.match_score ?? 0,
        type: (r.jobs?.opportunity_type ?? "full-time") as any,
        source: r.jobs?.source_name ?? "Unknown",
        status: r.status as any,
        priority: r.priority ?? 100,
      }));
    },
    staleTime: 10_000,
  });

  const buildQueueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("build-queue", {
        body: { user_id: user!.id },
      });
      if (error) throw error;
      return data as { queued: number };
    },
    onSuccess: async (d) => {
      toast({ title: "Queue updated", description: `${d.queued} item(s) queued.` });
      await qc.invalidateQueries({ queryKey: ["queue", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Queue build failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const list = realQueue ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto Apply Queue</h1>
          <p className="text-sm text-muted-foreground">{list.length} items in queue</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => buildQueueMutation.mutate()}
            disabled={!user?.id || buildQueueMutation.isPending}
          >
            {buildQueueMutation.isPending ? "Building..." : "Build Queue"}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{paused ? "Paused" : "Running"}</span>
            <Switch checked={!paused} onCheckedChange={(v) => setPaused(!v)} />
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Only supported direct-apply opportunities or connected-account sources are eligible for automation.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Queue is empty</p>
            <p className="text-sm">Build your queue from eligible matches.</p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
              <MatchRing value={item.matchPercent} size={40} strokeWidth={3} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.jobTitle}</span>
                  <StatusBadge variant={item.type === "internship" ? "internship" : "job"}>
                    {item.type === "internship" ? "Internship" : "Full-time"}
                  </StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground">{item.company} • {item.source}</p>
              </div>
              <StatusBadge variant={statusVariant[item.status]}>{item.status}</StatusBadge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
