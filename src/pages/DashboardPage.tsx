import {
  Briefcase, Zap, CheckCircle2, Target, AlertTriangle, Bookmark, TrendingUp,
  GraduationCap, FileText, Clock, RefreshCw, Loader2
} from "lucide-react";
import { MatchRing } from "@/components/ui/MatchRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const COLORS = ["hsl(239,84%,67%)", "hsl(160,84%,39%)", "hsl(38,92%,50%)", "hsl(199,89%,48%)", "hsl(280,65%,60%)", "hsl(215,16%,47%)"];

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="stat-card animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
      <div className="h-7 w-12 rounded bg-muted" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: realStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("dashboard-stats", {
          body: { user_id: user!.id },
        });
        if (error) {
          console.warn("[Dashboard] dashboard-stats edge function error:", error);
          return null;
        }
        return data as {
          jobsCount: number;
          internshipsCount: number;
          eligibleOpportunities: number;
          avgMatchScore: number;
          applicationsCount: number;
          failedCount: number;
        };
      } catch (err) {
        console.warn("[Dashboard] dashboard-stats failed:", err);
        return null;
      }
    },
    staleTime: 30_000,
  });

  // Extra stats: fetched today, auto-applied today, saved (queued), ATS score
  const { data: extraStats, isLoading: extraLoading } = useQuery({
    queryKey: ["dashboard-extra", user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayISO = todayStart.toISOString();

        const results = await Promise.all([
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .gte("created_at", todayISO),
          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user!.id)
            .gte("applied_at", todayISO),
          supabase
            .from("queue_items")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user!.id)
            .eq("status", "queued"),
          supabase
            .from("resumes")
            .select("ats_score")
            .eq("user_id", user!.id)
            .eq("is_primary", true)
            .maybeSingle(),
        ]);

        return {
          fetchedToday: results[0]?.count ?? 0,
          autoAppliedToday: results[1]?.count ?? 0,
          savedOpportunities: results[2]?.count ?? 0,
          atsScore: results[3]?.data?.ats_score ?? 0,
        };
      } catch (err) {
        console.warn("[Dashboard] extra stats failed:", err);
        return { fetchedToday: 0, autoAppliedToday: 0, savedOpportunities: 0, atsScore: 0 };
      }
    },
    staleTime: 30_000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { error: fetchErr } = await supabase.functions.invoke("fetch-jobs", { body: { user_id: user!.id, limit: 50 } });
      if (fetchErr) throw fetchErr;
      const { error: scoreErr } = await supabase.functions.invoke("score-jobs", { body: { user_id: user!.id } });
      if (scoreErr) throw scoreErr;
      const { error: queueErr } = await supabase.functions.invoke("build-queue", { body: { user_id: user!.id } });
      if (queueErr) throw queueErr;
    },
    onSuccess: async () => {
      toast({ title: "Dashboard refreshed" });
      await qc.invalidateQueries({ queryKey: ["dashboard-stats", user?.id] });
      await qc.invalidateQueries({ queryKey: ["dashboard-extra", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Refresh failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const s = {
    fetchedToday: extraStats?.fetchedToday ?? 0,
    eligibleAutoApply: realStats?.eligibleOpportunities ?? 0,
    autoAppliedToday: extraStats?.autoAppliedToday ?? 0,
    avgMatchScore: realStats?.avgMatchScore ?? 0,
    failedApplications: realStats?.failedCount ?? 0,
    savedOpportunities: extraStats?.savedOpportunities ?? 0,
    applicationsThisWeek: realStats?.applicationsCount ?? 0,
    jobsCount: realStats?.jobsCount ?? 0,
    internshipsCount: realStats?.internshipsCount ?? 0,
    atsScore: extraStats?.atsScore ?? 0,
    avgCompatibility: realStats?.avgMatchScore ?? 0,
    automationRunning: true,
  };

  const { data: checklist } = useQuery({
    queryKey: ["setup-checklist", user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      try {
        const results = await Promise.all([
          supabase.from("profiles").select("id").eq("id", user!.id).maybeSingle(),
          supabase.from("resumes").select("id").eq("user_id", user!.id).eq("is_primary", true).maybeSingle(),
          supabase.from("preferences").select("id").eq("user_id", user!.id).limit(1).maybeSingle(),
          supabase.from("answer_bank").select("id").eq("user_id", user!.id).limit(1).maybeSingle(),
          supabase.from("connected_sources").select("id").eq("user_id", user!.id).limit(1),
        ]);

        const profile = results[0]?.data;
        const activeResume = results[1]?.data;
        const pref = results[2]?.data;
        const answers = results[3]?.data;
        const sources = results[4]?.data;

        return [
          { id: "resume", label: "Resume uploaded", done: !!activeResume?.id },
          { id: "profile", label: "Profile completed", done: !!profile?.id },
          { id: "answers", label: "Answer bank completed", done: !!answers?.id },
          { id: "sources", label: "Preferred sources selected", done: (sources?.length ?? 0) > 0 },
          { id: "preferences", label: "Preferences configured", done: !!pref?.id },
        ].filter(Boolean);
      } catch (err) {
        console.warn("[Dashboard] checklist failed:", err);
        return [
          { id: "resume", label: "Resume uploaded", done: false },
          { id: "profile", label: "Profile completed", done: false },
          { id: "answers", label: "Answer bank completed", done: false },
          { id: "sources", label: "Preferred sources selected", done: false },
          { id: "preferences", label: "Preferences configured", done: false },
        ];
      }
    },
    staleTime: 20_000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("automation_logs")
          .select("id, message, level, stage, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(6);
        if (error) {
          console.warn("[Dashboard] recent activity error:", error);
          return [];
        }
        return (data ?? [])
          .filter((r: any) => r && typeof r === "object")
          .map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            action: r.stage ?? "Event",
            target: r.message ?? "",
            time: r.created_at ? new Date(r.created_at).toLocaleString() : "—",
            type: r.level === "error" ? "error" : r.level === "warn" ? "warning" : r.level === "success" ? "success" : "info",
          }));
      } catch (err) {
        console.warn("[Dashboard] recent activity failed:", err);
        return [];
      }
    },
    staleTime: 15_000,
  });

  const isLoading = statsLoading || extraLoading;

  const applicationsOverTime: Array<{ date: string; applied: number; matched: number }> = [];
  const sourceBreakdown: Array<{ name: string; count: number }> = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your job search activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={!user?.id || refreshMutation.isPending}
          >
            {refreshMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Refreshing...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-1" /> Refresh</>
            )}
          </Button>
          <StatusBadge variant={s.automationRunning ? "success" : "neutral"}>
            {s.automationRunning ? "Automation Running" : "Automation Paused"}
          </StatusBadge>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard icon={Briefcase} label="Fetched Today" value={s.fetchedToday} color="text-primary" />
          <StatCard icon={Zap} label="Eligible Auto Apply" value={s.eligibleAutoApply} color="text-primary" />
          <StatCard icon={CheckCircle2} label="Auto Applied Today" value={s.autoAppliedToday} color="text-success" />
          <StatCard icon={Target} label="Avg Match Score" value={`${s.avgMatchScore}%`} color="text-primary" />
          <StatCard icon={AlertTriangle} label="Failed" value={s.failedApplications} color="text-destructive" />
          <StatCard icon={Bookmark} label="Saved" value={s.savedOpportunities} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={TrendingUp} label="This Week" value={s.applicationsThisWeek} />
          <StatCard icon={Briefcase} label="Jobs" value={s.jobsCount} color="text-primary" />
          <StatCard icon={GraduationCap} label="Internships" value={s.internshipsCount} color="text-success" />
          <StatCard icon={FileText} label="ATS Score" value={`${s.atsScore}/100`} color="text-primary" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Applications Over Time</h3>
          {applicationsOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={applicationsOverTime}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="matched" fill="hsl(239,84%,67%)" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="applied" fill="hsl(239,84%,67%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Source Breakdown</h3>
          {sourceBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {sourceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scores */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Key Scores</h3>
          <div className="flex items-center justify-around">
            <MatchRing value={s.atsScore} size={72} strokeWidth={6} label="ATS Score" />
            <MatchRing value={s.avgCompatibility} size={72} strokeWidth={6} label="Avg Compatibility" />
            <MatchRing value={s.avgMatchScore} size={72} strokeWidth={6} label="Avg Match" />
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Missing Keywords</p>
            <p className="text-sm text-muted-foreground">Generate an ATS report to see missing keywords.</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(recentActivity ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              (recentActivity ?? []).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                      a.type === "success"
                        ? "bg-success"
                        : a.type === "error"
                          ? "bg-destructive"
                          : a.type === "warning"
                            ? "bg-warning"
                            : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-medium">{a.action}</span> {a.target}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Setup Checklist */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-2">Setup Checklist</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {(checklist ?? []).filter(c => c.done).length}/{(checklist ?? []).length} completed
          </p>
          <Progress value={(checklist?.length ? (checklist.filter(c => c.done).length / checklist.length) : 0) * 100} className="h-2 mb-4" />
          <div className="space-y-2">
            {(checklist ?? []).map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-success" : "text-muted-foreground/30"}`} />
                <span className={`text-sm ${item.done ? "" : "text-muted-foreground"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
