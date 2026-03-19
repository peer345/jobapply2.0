import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function PreferencesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prefRow } = useQuery({
    queryKey: ["preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 20_000,
  });

  const p = useMemo(() => {
    return {
      preferredRoles: prefRow?.target_roles ?? [],
      targetSkills: prefRow?.target_skills ?? [],
      locations: prefRow?.preferred_locations ?? [],
      minMatchThreshold: prefRow?.min_match_score ?? 60,
      remoteOk: prefRow?.remote_ok ?? true,
      hybridOk: prefRow?.hybrid_ok ?? false,
      onsiteOk: prefRow?.onsite_ok ?? false,
      jobTypes: prefRow?.job_types ?? [],
      internshipTypes: prefRow?.internship_types ?? [],
      preferredSources: prefRow?.preferred_sources ?? [],
      automationRules: {
        directApplyOnly: !!prefRow?.direct_apply_only,
        accountRequiredOk: prefRow?.account_required_ok ?? true,
        automationEnabled: prefRow?.automation_enabled ?? false,
      },
    };
  }, [prefRow]);

  const [rolesInput, setRolesInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [minMatch, setMinMatch] = useState<number>(60);
  const [remoteOk, setRemoteOk] = useState<boolean>(true);
  const [hybridOk, setHybridOk] = useState<boolean>(false);
  const [onsiteOk, setOnsiteOk] = useState<boolean>(false);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [internshipTypes, setInternshipTypes] = useState<string[]>([]);
  const [directOnly, setDirectOnly] = useState<boolean>(false);
  const [accountRequiredOk, setAccountRequiredOk] = useState<boolean>(true);
  const [automationEnabled, setAutomationEnabled] = useState<boolean>(false);

  useEffect(() => {
    setRolesInput((p.preferredRoles ?? []).join(", "));
    setSkillsInput((p.targetSkills ?? []).join(", "));
    setLocationsInput((p.locations ?? []).join(", "));
    setMinMatch(p.minMatchThreshold);
    setRemoteOk(p.remoteOk);
    setHybridOk(p.hybridOk);
    setOnsiteOk(p.onsiteOk);
    setJobTypes(p.jobTypes);
    setInternshipTypes(p.internshipTypes);
    setDirectOnly(p.automationRules.directApplyOnly);
    setAccountRequiredOk(p.automationRules.accountRequiredOk);
    setAutomationEnabled(p.automationRules.automationEnabled);
  }, [
    p.preferredRoles,
    p.targetSkills,
    p.locations,
    p.minMatchThreshold,
    p.remoteOk,
    p.hybridOk,
    p.onsiteOk,
    p.jobTypes,
    p.internshipTypes,
    p.automationRules.directApplyOnly,
    p.automationRules.accountRequiredOk,
    p.automationRules.automationEnabled,
  ]);

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        target_roles: parseCsv(rolesInput),
        target_skills: parseCsv(skillsInput),
        preferred_locations: parseCsv(locationsInput),
        remote_ok: remoteOk,
        hybrid_ok: hybridOk,
        onsite_ok: onsiteOk,
        job_types: jobTypes,
        internship_types: internshipTypes,
        preferred_sources: prefRow?.preferred_sources ?? [],
        min_match_score: minMatch,
        direct_apply_only: directOnly,
        account_required_ok: accountRequiredOk,
        automation_enabled: automationEnabled,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("preferences")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Preferences saved" });
      await qc.invalidateQueries({ queryKey: ["preferences", user?.id] });
    },
    onError: (e: any) => {
      toast({
        title: "Save failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleValue = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) setter(list.filter((x) => x !== value));
    else setter([...list, value]);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preferences</h1>
          <p className="text-sm text-muted-foreground">Configure your job search settings</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={!user?.id || saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="font-semibold">Job Search</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Preferred Roles</Label>
            <Input
              value={rolesInput}
              onChange={(e) => setRolesInput(e.target.value)}
              placeholder="Frontend Developer, Backend Developer"
            />
            <div className="flex flex-wrap gap-1 pt-2">
              {parseCsv(rolesInput).map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Target Skills</Label>
            <Input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, Node.js, SQL"
            />
            <div className="flex flex-wrap gap-1 pt-2">
              {parseCsv(skillsInput).map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label>Locations</Label>
            <Input
              value={locationsInput}
              onChange={(e) => setLocationsInput(e.target.value)}
              placeholder="Remote, New York, London"
            />
            <div className="flex flex-wrap gap-1 pt-2">
              {parseCsv(locationsInput).map((l) => (
                <Badge key={l} variant="secondary">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Minimum Match Threshold: {minMatch}%</Label>
          <Slider
            value={[minMatch]}
            onValueChange={(v) => setMinMatch(v[0] ?? 60)}
            max={100}
            step={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Work Modes</Label>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remoteOk}
                onChange={(e) => setRemoteOk(e.target.checked)}
              />
              Remote
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hybridOk}
                onChange={(e) => setHybridOk(e.target.checked)}
              />
              Hybrid
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onsiteOk}
                onChange={(e) => setOnsiteOk(e.target.checked)}
              />
              Onsite
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Opportunity Type</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant={jobTypes.includes("full-time") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleValue(jobTypes, "full-time", setJobTypes)}
            >
              Jobs
            </Button>

            <Button
              type="button"
              variant={internshipTypes.includes("internship") ? "default" : "outline"}
              size="sm"
              onClick={() =>
                toggleValue(internshipTypes, "internship", setInternshipTypes)
              }
            >
              Internships
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Automation Rules</h3>
        {[
          {
            key: "directApplyOnly",
            label: "Apply only to direct-apply sources",
          },
          {
            key: "accountRequiredOk",
            label: "Allow account-required sources",
          },
          {
            key: "automationEnabled",
            label: "Enable automation",
          },
        ].map((rule) => (
          <div key={rule.key} className="flex items-center justify-between">
            <span className="text-sm">{rule.label}</span>
            <Switch
              checked={
                rule.key === "directApplyOnly"
                  ? directOnly
                  : rule.key === "accountRequiredOk"
                  ? accountRequiredOk
                  : automationEnabled
              }
              onCheckedChange={(v) => {
                if (rule.key === "directApplyOnly") setDirectOnly(v);
                if (rule.key === "accountRequiredOk") setAccountRequiredOk(v);
                if (rule.key === "automationEnabled") setAutomationEnabled(v);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}