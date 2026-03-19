import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

type SourceCategory = "direct" | "account_required" | "coming_soon";
type SourceCard = {
  id: string;
  name: string;
  description: string;
  category: SourceCategory;
  loginRequired: boolean;
  autoApply: boolean;
  supportsJobs: boolean;
  supportsInternships: boolean;
  connected: boolean;
  lastSynced?: string;
};

function SourceSection({ title, sources }: { title: string; sources: SourceCard[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{s.name}</span>
              <div className="flex gap-1">
                {s.autoApply && <StatusBadge variant="direct">Direct Apply</StatusBadge>}
                {s.loginRequired && <StatusBadge variant="account">Login Required</StatusBadge>}
                {s.category === "coming_soon" && <StatusBadge variant="neutral">Coming Soon</StatusBadge>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{s.description}</p>
            <div className="flex items-center gap-3 text-xs">
              {s.supportsJobs && <StatusBadge variant="job">Jobs</StatusBadge>}
              {s.supportsInternships && <StatusBadge variant="internship">Internships</StatusBadge>}
              <span className="flex items-center gap-1">
                {s.connected ? <CheckCircle2 className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                {s.connected ? "Selected" : "Not selected"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SourceCapabilitiesPage() {
  const { user } = useAuth();

  const { data: realSources } = useQuery({
    queryKey: ["source-capabilities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_capabilities")
        .select("source, fetch_supported, auto_apply_supported, requires_connected_account, description, category, supports_opportunity_type");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: connected } = useQuery({
    queryKey: ["connected-sources-mini", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connected_sources")
        .select("source, is_connected, last_synced_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const connectedBySource = new Map((connected ?? []).map((r: any) => [(r.source ?? "").toLowerCase(), r]));

  const mapped: SourceCard[] = (realSources ?? []).map((s: any) => {
    const src = s.source as string;
    const cat: SourceCategory =
      (s.category ?? "") === "Direct Apply"
        ? "direct"
        : (s.category ?? "") === "Account Required"
          ? "account_required"
          : "coming_soon";
    const row = connectedBySource.get(src.toLowerCase());
    return {
      id: src.toLowerCase(),
      name: src,
      description: s.description ?? "",
      category: cat,
      loginRequired: !!s.requires_connected_account,
      autoApply: !!s.auto_apply_supported,
      supportsJobs: (s.supports_opportunity_type ?? "both") !== "internship",
      supportsInternships: (s.supports_opportunity_type ?? "both") !== "full-time",
      connected: row ? !!row.is_connected : false,
      lastSynced: row?.last_synced_at ? new Date(row.last_synced_at).toLocaleString() : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Source Capabilities</h1>
        <p className="text-sm text-muted-foreground">Understand what each platform supports</p>
      </div>
      {mapped.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
          <p className="font-medium">No source capability data yet</p>
          <p className="text-sm">Run the `source_capabilities` seed in Supabase and refresh.</p>
        </div>
      ) : (
        <>
          <SourceSection title="Direct Auto Apply Sources" sources={mapped.filter((s) => s.category === "direct")} />
          <SourceSection title="Account Required Sources" sources={mapped.filter((s) => s.category === "account_required")} />
          <SourceSection title="Coming Soon" sources={mapped.filter((s) => s.category === "coming_soon")} />
        </>
      )}
    </div>
  );
}
