import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MatchRing } from "@/components/ui/MatchRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Search,
  Eye,
  Zap,
  Bookmark,
  SkipForward,
  Sparkles,
  MapPin,
  Building2,
  Clock,
  Briefcase,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

type FitLevel = "strong" | "good" | "fair" | "low";
type SourceCategory = "direct" | "account_required" | "coming_soon";
type ApplyStatus = "ready" | "needs_account" | "unsupported" | "applied" | "skipped";
type OpportunityType = "full-time" | "internship";

type JobMatchRow = {
  id: string;
  job_id?: string;
  title: string;
  company: string;
  location: string;
  remote: "remote" | "hybrid" | "onsite";
  source: string;
  sourceCategory: SourceCategory;
  type: OpportunityType;
  postedDate: string;
  matchPercent: number;
  atsScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  applyStatus: ApplyStatus;
  fitLevel: FitLevel;
  description: string;
  strongAreas: string[];
  weakAreas: string[];
  applyUrl?: string;
  experienceGap?: string;
  locationMismatch?: boolean;
};

const statusLabel: Record<string, string> = {
  ready: "Ready to Apply",
  needs_account: "Needs Account",
  unsupported: "Unsupported",
  applied: "Applied",
  skipped: "Skipped",
};

const statusVariant: Record<
  string,
  "success" | "warning" | "error" | "neutral" | "direct"
> = {
  ready: "success",
  needs_account: "warning",
  unsupported: "error",
  applied: "direct",
  skipped: "neutral",
};

const fitLabel: Record<string, string> = {
  strong: "Strong Fit",
  good: "Good Fit",
  fair: "Fair Fit",
  low: "Low Fit",
};

const fitVariant: Record<string, "success" | "direct" | "warning" | "error"> = {
  strong: "success",
  good: "direct",
  fair: "warning",
  low: "error",
};

function JobRow({ job, onSelect }: { job: JobMatchRow; onSelect: () => void }) {
  return (
    <div
      className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors duration-150 cursor-pointer"
      onClick={onSelect}
    >
      <MatchRing value={job.matchPercent} size={44} strokeWidth={3} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">{job.title}</h3>
          <StatusBadge variant={job.type === "internship" ? "internship" : "job"}>
            {job.type === "internship" ? "Internship" : "Full-time"}
          </StatusBadge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {job.company}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {job.postedDate}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <StatusBadge variant={statusVariant[job.applyStatus]}>
            {statusLabel[job.applyStatus]}
          </StatusBadge>
          <StatusBadge variant={fitVariant[job.fitLevel]}>
            {fitLabel[job.fitLevel]}
          </StatusBadge>
          <StatusBadge variant={job.sourceCategory === "direct" ? "direct" : "account"}>
            {job.source}
          </StatusBadge>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function JobDetailDrawer({
  job,
  open,
  onClose,
}: {
  job: JobMatchRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!job) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{job.title}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {job.company} • {job.location}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-6">
            <MatchRing value={job.matchPercent} size={80} strokeWidth={6} label="Compatibility" />
            <MatchRing value={job.atsScore} size={80} strokeWidth={6} label="ATS Score" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <StatusBadge variant={job.type === "internship" ? "internship" : "job"}>
              {job.type === "internship" ? "Internship" : "Full-time"}
            </StatusBadge>
            <StatusBadge variant={statusVariant[job.applyStatus]}>
              {statusLabel[job.applyStatus]}
            </StatusBadge>
            <StatusBadge variant={job.sourceCategory === "direct" ? "direct" : "account"}>
              {job.source}
            </StatusBadge>
            <Badge variant="outline" className="text-xs">
              {job.remote}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{job.description}</p>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-success">Strong Match Areas</h4>
            <div className="flex flex-wrap gap-1">
              {job.strongAreas.map((a) => (
                <StatusBadge key={a} variant="success">
                  {a}
                </StatusBadge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-warning">Weak Areas</h4>
            <div className="flex flex-wrap gap-1">
              {job.weakAreas.map((a) => (
                <StatusBadge key={a} variant="warning">
                  {a}
                </StatusBadge>
              ))}
            </div>
          </div>

          {job.missingSkills.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-destructive">Missing Skills</h4>
              <div className="flex flex-wrap gap-1">
                {job.missingSkills.map((s) => (
                  <StatusBadge key={s} variant="error">
                    {s}
                  </StatusBadge>
                ))}
              </div>
            </div>
          )}

          {job.missingKeywords.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Missing Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {job.missingKeywords.map((k) => (
                  <StatusBadge key={k} variant="warning">
                    {k}
                  </StatusBadge>
                ))}
              </div>
            </div>
          )}

          {job.experienceGap && (
            <div className="text-sm text-warning">⚠ Experience gap: {job.experienceGap}</div>
          )}

          {job.locationMismatch && (
            <div className="text-sm text-warning">
              ⚠ Location mismatch — may require relocation
            </div>
          )}

          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="font-semibold text-sm">Resume Optimization</h4>
            <p className="text-xs text-muted-foreground">
              Improve your resume for this specific opportunity.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Customize Resume
              </Button>
              <Button size="sm" variant="outline">
                Rewrite Summary
              </Button>
              <Button size="sm" variant="outline">
                Improve Bullets
              </Button>
              <Button size="sm" variant="outline">
                Save Optimized
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {job.applyStatus === "ready" && (
              <Button className="flex-1 gap-1">
                <Zap className="h-4 w-4" />
                Apply Now
              </Button>
            )}
            {job.applyStatus === "needs_account" && (
              <Button variant="outline" className="flex-1">
                Connect Account to Apply
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function JobMatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<JobMatchRow | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: realRows, isLoading } = useQuery({
    queryKey: ["job-matches", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [
        { data: matches, error: mErr },
        { data: caps },
        { data: connected },
        { data: applications },
      ] = await Promise.all([
        supabase
          .from("job_matches")
          .select(
            "job_id, match_score, fit_level, status, jobs:jobs (id, title, company, location, work_mode, description, apply_url, posted_at, opportunity_type, source_name)",
          )
          .eq("user_id", user!.id)
          .order("match_score", { ascending: false })
          .limit(200),
        supabase.from("source_capabilities").select("source_name, auto_apply_supported, requires_connected_account, category"),
        supabase.from("connected_sources").select("source_name, is_connected").eq("user_id", user!.id),
        supabase.from("applications").select("job_id").eq("user_id", user!.id),
      ]);

      if (mErr) throw mErr;

      const capsBySource = new Map(
        (caps ?? []).map((c: any) => [
          (c.source_name ?? "").toLowerCase(),
          {
            auto_apply_supported: !!c.auto_apply_supported,
            requires_connected_account: !!c.requires_connected_account,
            category: (c.category ?? "") as string,
          },
        ]),
      );

      const connectedBySource = new Map(
        (connected ?? []).map((c: any) => [(c.source_name ?? "").toLowerCase(), !!c.is_connected]),
      );

      const appliedJobIds = new Set((applications ?? []).map((a: any) => a.job_id));

      const relTime = (postedAt?: string | null) => {
        if (!postedAt) return "—";
        const ms = Date.now() - new Date(postedAt).getTime();
        const h = Math.max(1, Math.round(ms / 3600_000));
        if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
        const d = Math.round(h / 24);
        return `${d} day${d === 1 ? "" : "s"} ago`;
      };

      const toFit = (score: number): FitLevel =>
        score >= 85 ? "strong" : score >= 70 ? "good" : score >= 50 ? "fair" : "low";

      return (matches ?? []).map((m: any) => {
        const j = m.jobs;
        const srcKey = (j?.source_name ?? "").toLowerCase();
        const cap = capsBySource.get(srcKey);
        const requiresConn = !!cap?.requires_connected_account;
        const isConnected = connectedBySource.get(srcKey) ?? false;
        const isApplied = appliedJobIds.has(j?.id);

        const sourceCategory: SourceCategory = requiresConn
          ? "account_required"
          : cap?.auto_apply_supported
            ? "direct"
            : "coming_soon";

        let applyStatus: ApplyStatus = "ready";
        if (isApplied) applyStatus = "applied";
        else if (requiresConn && !isConnected) applyStatus = "needs_account";
        else if (cap && !cap.auto_apply_supported && !requiresConn) applyStatus = "unsupported";

        const row: JobMatchRow = {
          id: `${m.job_id}`,
          job_id: j?.id,
          title: j?.title ?? "Untitled role",
          company: j?.company ?? "Unknown company",
          location: j?.location ?? "—",
          remote: (j?.work_mode ?? "remote") as "remote" | "hybrid" | "onsite",
          source: j?.source_name ?? "Unknown",
          sourceCategory,
          type: (j?.opportunity_type ?? "full-time") as OpportunityType,
          postedDate: relTime(j?.posted_at),
          matchPercent: m.match_score ?? 0,
          atsScore: 0,
          missingSkills: [],
          missingKeywords: [],
          applyStatus,
          fitLevel: (m.fit_level as FitLevel) || toFit(m.match_score ?? 0),
          description: j?.description ?? "",
          strongAreas: [],
          weakAreas: [],
          applyUrl: j?.apply_url ?? undefined,
        };

        return row;
      });
    },
    staleTime: 20_000,
  });

  const fetchAndScoreMutation = useMutation({
    mutationFn: async () => {
      const { error: fetchErr } = await supabase.functions.invoke("fetch-jobs", { body: { user_id: user!.id, limit: 50 } });
      if (fetchErr) throw fetchErr;

      const { error: scoreErr } = await supabase.functions.invoke("score-jobs", {
        body: { user_id: user!.id },
      });
      if (scoreErr) throw scoreErr;
    },
    onSuccess: async () => {
      toast({ title: "Jobs fetched and scored" });
      await qc.invalidateQueries({ queryKey: ["job-matches", user?.id] });
    },
    onError: (e: any) => {
      toast({
        title: "Refresh failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const jobs = (realRows ?? []) as JobMatchRow[];

  const filteredJobs = jobs.filter((j) => {
    if (
      search &&
      !j.title.toLowerCase().includes(search.toLowerCase()) &&
      !j.company.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    if (tab === "high") return j.matchPercent >= 80;
    if (tab === "direct") return j.sourceCategory === "direct" && j.applyStatus === "ready";
    if (tab === "review") return j.fitLevel === "fair" || j.fitLevel === "low";
    if (tab === "account") return j.sourceCategory === "account_required";
    if (tab === "skipped") return j.applyStatus === "skipped";
    if (tab === "jobs") return j.type === "full-time";
    if (tab === "internships") return j.type === "internship";
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Job Matches</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading matches..." : `${jobs.length} opportunities found`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchAndScoreMutation.mutate()}
          disabled={!user?.id || fetchAndScoreMutation.isPending}
        >
          {fetchAndScoreMutation.isPending ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
          <TabsTrigger value="high">High Match</TabsTrigger>
          <TabsTrigger value="direct">Direct Apply</TabsTrigger>
          <TabsTrigger value="review">Review Needed</TabsTrigger>
          <TabsTrigger value="account">Account Required</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="internships">Internships</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Loading your matches…</p>
            <p className="text-sm">This usually takes a few seconds.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {jobs.length ? "No opportunities match your filters" : "No matches yet"}
            </p>
            <p className="text-sm">
              {jobs.length
                ? "Try adjusting your search or filter criteria."
                : "Click Refresh to fetch and score jobs."}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobRow key={job.id} job={job} onSelect={() => setSelected(job)} />
          ))
        )}
      </div>

      <JobDetailDrawer job={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}