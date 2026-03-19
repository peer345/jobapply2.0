import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link2, Unlink, Clock } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function ConnectedAccountsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: realRows } = useQuery({
    queryKey: ["connected-sources", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: caps, error: capsErr }, { data: connected, error: cErr }] = await Promise.all([
        supabase.from("source_capabilities").select("source_name, requires_connected_account, category"),
        supabase.from("connected_sources").select("source_name, is_connected, last_synced_at").eq("user_id", user!.id),
      ]);
      if (capsErr) throw capsErr;
      if (cErr) throw cErr;

      const bySource = new Map((connected ?? []).map((r: any) => [(r.source_name ?? "").toLowerCase(), r]));
      const accountSources = (caps ?? []).filter((c: any) => c.requires_connected_account);

      return accountSources.map((c: any) => {
        const r = bySource.get((c.source_name ?? "").toLowerCase());
        return {
          id: (c.source_name ?? "").toLowerCase(),
          name: c.source_name as string,
          connected: !!r?.is_connected,
          lastSynced: r?.last_synced_at ? new Date(r.last_synced_at).toLocaleString() : undefined,
          profileCompleteness: r?.connection_metadata?.profileCompleteness ?? undefined,
          source: c.source_name as string,
        };
      });
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (row: { source: string; connected: boolean }) => {
      const next = !row.connected;
      const { error } = await supabase.from("connected_sources").upsert({
        user_id: user!.id,
        source_name: row.source,
        is_connected: next,
        last_synced_at: next ? new Date().toISOString() : null,
      }, { onConflict: "user_id,source_name" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["connected-sources", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const list = realRows ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connected Accounts</h1>
        <p className="text-sm text-muted-foreground">Manage external platform connections</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.length === 0 ? (
          <div className="col-span-full bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
            <p className="font-medium">No account-required sources found</p>
            <p className="text-sm">Seed `source_capabilities` and refresh this page.</p>
          </div>
        ) : list.map((acc: any) => (
          <div key={acc.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{acc.name}</h3>
              <StatusBadge variant={acc.connected ? "success" : "neutral"}>
                {acc.connected ? "Connected" : "Not Connected"}
              </StatusBadge>
            </div>
            {acc.connected && (
              <>
                {acc.lastSynced && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Last synced: {acc.lastSynced}
                  </p>
                )}
                {acc.profileCompleteness && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Profile Completeness</span>
                      <span className="font-medium">{acc.profileCompleteness}%</span>
                    </div>
                    <Progress value={acc.profileCompleteness} className="h-1.5" />
                  </div>
                )}
              </>
            )}
            <Button
              variant={acc.connected ? "outline" : "default"}
              size="sm"
              className="w-full gap-2"
              onClick={() => toggleMutation.mutate({ source: acc.source, connected: acc.connected })}
              disabled={!user?.id || toggleMutation.isPending}
            >
              {acc.connected ? <><Unlink className="h-3 w-3" /> Disconnect</> : <><Link2 className="h-3 w-3" /> Connect</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
