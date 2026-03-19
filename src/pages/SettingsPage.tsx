import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 20_000,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "");
    setEmail(profile?.email ?? user?.email ?? "");
  }, [profile?.id, user?.email, user?.user_metadata]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({
        id: user!.id,
        full_name: fullName || null,
        email: email || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Profile updated" });
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <Button size="sm" className="gap-2" onClick={() => saveMutation.mutate()} disabled={!user?.id || saveMutation.isPending}>
          <Save className="h-3 w-3" /> {saveMutation.isPending ? "Saving..." : "Update Profile"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Notifications</h3>
        {[
          "Email me when new high-match opportunities are found",
          "Email me when an auto-apply completes",
          "Email me weekly summary",
          "Browser push notifications",
        ].map(item => (
          <div key={item} className="flex items-center justify-between">
            <span className="text-sm">{item}</span>
            <Switch defaultChecked />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Automation</h3>
        {[
          { label: "Enable auto-apply", checked: true },
          { label: "Pause on weekends", checked: false },
          { label: "Respect daily apply limit", checked: true },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <Switch defaultChecked={item.checked} />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Privacy & Data</h3>
        <p className="text-sm text-muted-foreground">Your data is stored securely and never shared with third parties.</p>
        <Button variant="outline" size="sm">Export My Data</Button>
      </div>

      <div className="bg-card border border-destructive/20 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back.</p>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => toast({ title: "Not enabled yet", description: "Account deletion requires a server-side admin flow.", variant: "destructive" })}
        >
          <Trash2 className="h-3 w-3" /> Delete Account
        </Button>
      </div>
    </div>
  );
}
