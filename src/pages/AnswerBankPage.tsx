import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";

const fields = [
  { key: "notice_period", label: "Notice Period", category: "application" },
  { key: "work_authorization", label: "Work Authorization", category: "application" },
  { key: "sponsorship_needed", label: "Need Visa Sponsorship?", category: "application" },
  { key: "willing_to_relocate", label: "Willing to Relocate?", category: "application" },
  { key: "expected_salary", label: "Expected Salary", category: "compensation" },
  { key: "expected_stipend", label: "Expected Stipend", category: "compensation" },
  { key: "years_of_experience", label: "Years of Experience", category: "profile" },
  { key: "current_city", label: "Current City", category: "profile" },
  { key: "preferred_city", label: "Preferred City", category: "profile" },
  { key: "linkedin_url", label: "LinkedIn URL", category: "links" },
  { key: "github_url", label: "GitHub URL", category: "links" },
  { key: "portfolio_link", label: "Portfolio URL", category: "links" },
];

export default function AnswerBankPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows } = useQuery({
    queryKey: ["answer-bank", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answer_bank")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 20_000,
  });

  const answerMap = useMemo(() => {
    const map: Record<string, string> = {};
    (rows ?? []).forEach((row: any) => {
      const key = row?.question_key;
      if (!key) return;
      map[key] = row?.answer_text ?? "";
    });
    return map;
  }, [rows]);

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      init[f.key] = "";
    });
    return init;
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      next[f.key] = answerMap[f.key] ?? "";
    });
    setForm(next);
  }, [answerMap]);

  const completion = Math.round(
    (Object.values(form).filter((v) => String(v ?? "").trim().length > 0).length / fields.length) * 100,
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: rows?.[0]?.id, // Assuming we are updating a single row for the user, and taking the first one if multiple exist
        user_id: user!.id,
        question_key: "default", // This is now a fixed value
        notice_period: form.notice_period || null,
        work_authorization: form.work_authorization || null,
        sponsorship_needed: form.sponsorship_needed || null,
        willing_to_relocate: form.willing_to_relocate || null,
        expected_salary: form.expected_salary || null,
        expected_stipend: form.expected_stipend || null,
        years_of_experience: form.years_of_experience || null,
        current_city: form.current_city || null,
        preferred_city: form.preferred_city || null,
        linkedin_url: form.linkedin_url || null,
        github_url: form.github_url || null,
        portfolio_link: form.portfolio_link || null,
        updated_at: new Date().toISOString(),
      };

      console.log("ANSWER BANK SAVE PAYLOAD", payload);

      const { error } = await supabase
        .from("answer_bank")
        .upsert(payload, { onConflict: "user_id,question_key" }); // Conflict on user_id and the fixed question_key

      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Answer bank saved" });
      await qc.invalidateQueries({ queryKey: ["answer-bank", user?.id] });
    },
    onError: (e: any) => {
      toast({
        title: "Save failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Answer Bank</h1>
          <p className="text-sm text-muted-foreground">Pre-fill common application questions</p>
        </div>

        <Button
          className="gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={!user?.id || saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Completion</span>
          <span className="text-sm font-semibold">{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              <Input
                value={form[f.key] || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [f.key]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}