import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Upload, FileText, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const steps = ["Upload Resume", "Review Data", "Job Preferences", "Answer Bank", "Select Sources", "Finish"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [prefForm, setPrefForm] = useState({
    preferred_roles: [] as string[],
    preferred_locations: [] as string[],
    work_modes: ["Remote"] as string[],
    min_match_score: 60,
    daily_apply_limit: 25,
    opportunity_type: "both",
    experience_level: "Junior",
    blacklisted_companies: [] as string[],
    preferred_platforms: [] as string[],
  });

  const [answerForm, setAnswerForm] = useState({
    notice_period: "",
    work_authorization: "",
    sponsorship_needed: "",
    willing_to_relocate: "",
    expected_salary: "",
    expected_stipend: "",
    years_of_experience: "",
    current_city: "",
    preferred_city: "",
    linkedin_url: "",
    github_url: "",
    portfolio_link: "",
  });

  const { data: sourceCaps, isLoading: sourcesLoading } = useQuery({
    queryKey: ["source-capabilities-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_capabilities")
        .select("source, auto_apply_supported, requires_connected_account, description, category, supports_opportunity_type");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // Load existing rows (or auth metadata) so onboarding is real, not fake.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [{ data: profile }, { data: pref }, { data: ans }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("preferences").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("answer_bank").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setProfileForm((p) => ({
        ...p,
        full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? "",
        linkedin_url: profile?.linkedin_url ?? "",
        github_url: profile?.github_url ?? "",
        portfolio_url: profile?.portfolio_url ?? "",
      }));

      if (pref) {
        setPrefForm((x) => ({
          ...x,
          preferred_roles: pref.preferred_roles ?? [],
          preferred_locations: pref.preferred_locations ?? [],
          work_modes: pref.work_modes ?? ["Remote"],
          min_match_score: pref.min_match_score ?? 60,
          daily_apply_limit: pref.daily_apply_limit ?? 25,
          opportunity_type: pref.opportunity_type ?? "both",
          experience_level: pref.experience_level ?? "Junior",
          blacklisted_companies: pref.blacklisted_companies ?? [],
          preferred_platforms: (pref.preferred_platforms ?? []).filter(Boolean),
        }));
      }

      if (ans) {
        setAnswerForm((a) => ({
          ...a,
          notice_period: ans.notice_period ?? "",
          work_authorization: ans.work_authorization ?? "",
          sponsorship_needed: ans.sponsorship_needed ?? "",
          willing_to_relocate: ans.willing_to_relocate ?? "",
          expected_salary: ans.expected_salary ?? "",
          expected_stipend: ans.expected_stipend ?? "",
          years_of_experience: ans.years_of_experience ?? "",
          current_city: ans.current_city ?? "",
          preferred_city: ans.preferred_city ?? "",
          linkedin_url: ans.linkedin_url ?? "",
          github_url: ans.github_url ?? "",
          portfolio_link: ans.portfolio_link ?? "",
        }));
      }
    })().catch(() => {});
  }, [user?.id]);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleUpload = async (file: File) => {
    if (!user?.id) return;

    setUploading(true);

    try {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

      if (upErr) throw upErr;

      const { error: resetErr } = await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      if (resetErr) throw resetErr;

      const { error: insErr } = await supabase.from("resumes").insert({
        user_id: user.id,
        file_path: path,
        file_name: file.name,
        is_primary: true,
      });

      if (insErr) throw insErr;

      setProfileForm({
        full_name: "",
        email: "",
        phone: "",
        linkedin_url: "",
        github_url: "",
        portfolio_url: "",
      });

      setAnswerForm({
        notice_period: "",
        work_authorization: "",
        sponsorship_needed: "",
        willing_to_relocate: "",
        expected_salary: "",
        expected_stipend: "",
        years_of_experience: "",
        current_city: "",
        preferred_city: "",
        linkedin_url: "",
        github_url: "",
        portfolio_link: "",
      });

      setUploaded(true);
      setUploadedFileName(file.name);

      toast({
        title: "Resume uploaded",
        description: "Upload complete. Review and enter your details in the next step.",
      });
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedSources = useMemo(
    () => new Set(
      (prefForm.preferred_platforms ?? [])
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .map((s) => s.toLowerCase())
    ),
    [prefForm.preferred_platforms],
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-8 lg:w-16 h-0.5 mx-1 ${
                      i < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="text-center space-y-6">
                  <h2 className="text-xl font-bold">Upload Your Resume</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload your resume first. If parsing is not connected yet, you can review and enter details manually in the next step.
                  </p>

                  {!uploaded ? (
                    <div
                      onClick={!uploading ? () => fileInputRef.current?.click() : undefined}
                      className="border-2 border-dashed border-border rounded-xl p-12 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f);
                          e.currentTarget.value = "";
                        }}
                      />

                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading resume...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <p className="font-medium">Drag & drop or click to upload</p>
                          <p className="text-xs text-muted-foreground">PDF or DOCX, max 5MB</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{uploadedFileName ?? "resume.pdf"}</p>
                        <p className="text-xs text-muted-foreground">Uploaded successfully</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success ml-auto" />
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Review Parsed Data</h2>
                  <p className="text-sm text-muted-foreground">
                    Parsing is not connected yet. Please review and enter your details manually.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, full_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>LinkedIn</Label>
                      <Input
                        value={profileForm.linkedin_url}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, linkedin_url: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>GitHub</Label>
                      <Input
                        value={profileForm.github_url}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, github_url: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Portfolio</Label>
                      <Input
                        value={profileForm.portfolio_url}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, portfolio_url: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 border border-border rounded-xl p-4">
                    <p className="text-sm font-medium">Resume parsing</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatic extraction of skills, experience, and education will appear here once the resume parsing pipeline is connected.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Job Preferences</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Preferred Roles</Label>
                      <Input
                        value={prefForm.preferred_roles.join(", ")}
                        onChange={(e) =>
                          setPrefForm((p) => ({
                            ...p,
                            preferred_roles: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Preferred Locations</Label>
                      <Input
                        value={prefForm.preferred_locations.join(", ")}
                        onChange={(e) =>
                          setPrefForm((p) => ({
                            ...p,
                            preferred_locations: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Work Mode</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={prefForm.work_modes[0] ?? "Remote"}
                        onChange={(e) =>
                          setPrefForm((p) => ({ ...p, work_modes: [e.target.value] }))
                        }
                      >
                        <option>Remote</option>
                        <option>Hybrid</option>
                        <option>Onsite</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Experience Level</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={prefForm.experience_level}
                        onChange={(e) =>
                          setPrefForm((p) => ({ ...p, experience_level: e.target.value }))
                        }
                      >
                        <option>Junior</option>
                        <option>Mid-Level</option>
                        <option>Senior</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Expected Salary</Label>
                      <Input
                        value={answerForm.expected_salary}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, expected_salary: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Expected Stipend</Label>
                      <Input
                        value={answerForm.expected_stipend}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, expected_stipend: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Opportunity Type</Label>
                    <div className="flex gap-2">
                      {["full-time job", "internship", "both"].map((t) => (
                        <Button
                          key={t}
                          variant={prefForm.opportunity_type === t ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setPrefForm((p) => ({ ...p, opportunity_type: t }))
                          }
                        >
                          {t === "full-time job"
                            ? "Full-time Job"
                            : t === "internship"
                              ? "Internship"
                              : "Both"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Match Threshold: {prefForm.min_match_score}%</Label>
                    <Slider
                      value={[prefForm.min_match_score]}
                      onValueChange={(v) =>
                        setPrefForm((p) => ({ ...p, min_match_score: v[0] ?? 60 }))
                      }
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Daily Apply Limit</Label>
                    <Input
                      type="number"
                      value={prefForm.daily_apply_limit}
                      onChange={(e) =>
                        setPrefForm((p) => ({
                          ...p,
                          daily_apply_limit: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Blacklist Companies</Label>
                    <Input
                      placeholder="Comma-separated company names"
                      onChange={(e) =>
                        setPrefForm((p) => ({
                          ...p,
                          blacklisted_companies: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Answer Bank</h2>
                  <p className="text-sm text-muted-foreground">
                    Pre-fill common application questions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Notice Period</Label>
                      <Input
                        value={answerForm.notice_period}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, notice_period: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Work Authorization</Label>
                      <Input
                        value={answerForm.work_authorization}
                        onChange={(e) =>
                          setAnswerForm((a) => ({
                            ...a,
                            work_authorization: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Need Visa Sponsorship?</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={answerForm.sponsorship_needed}
                        onChange={(e) =>
                          setAnswerForm((a) => ({
                            ...a,
                            sponsorship_needed: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Willing to Relocate?</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={answerForm.willing_to_relocate}
                        onChange={(e) =>
                          setAnswerForm((a) => ({
                            ...a,
                            willing_to_relocate: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Depends on location">Depends on location</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Expected Salary</Label>
                      <Input
                        value={answerForm.expected_salary}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, expected_salary: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Expected Stipend</Label>
                      <Input
                        value={answerForm.expected_stipend}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, expected_stipend: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Years of Experience</Label>
                      <Input
                        value={answerForm.years_of_experience}
                        onChange={(e) =>
                          setAnswerForm((a) => ({
                            ...a,
                            years_of_experience: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Current City</Label>
                      <Input
                        value={answerForm.current_city}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, current_city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Preferred City</Label>
                      <Input
                        value={answerForm.preferred_city}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, preferred_city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={answerForm.linkedin_url}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, linkedin_url: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>GitHub URL</Label>
                      <Input
                        value={answerForm.github_url}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, github_url: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Portfolio URL</Label>
                      <Input
                        value={answerForm.portfolio_link}
                        onChange={(e) =>
                          setAnswerForm((a) => ({ ...a, portfolio_link: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Select Job Sources</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose which platforms to fetch opportunities from.
                  </p>

                  {sourcesLoading ? (
                    <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
                      Loading sources…
                    </div>
                  ) : (sourceCaps?.length ?? 0) === 0 ? (
                    <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
                      No sources available yet. Seed `source_capabilities` in Supabase and refresh.
                    </div>
                  ) : [
                    { label: "Direct Auto Apply", category: "direct" as const },
                    {
                      label: "Account Required / Fetch Only",
                      category: "account_required" as const,
                    },
                    { label: "Coming Soon", category: "coming_soon" as const },
                  ].map(({ label, category }) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm mb-2">{label}</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {(sourceCaps ?? [])
                          .map((s: any) => {
                            const src = (s.source as string) || "";
                            const cat =
                              (s.category ?? "") === "Direct Apply"
                                ? "direct"
                                : (s.category ?? "") === "Account Required"
                                  ? "account_required"
                                  : "coming_soon";
                            return {
                              id: src.toLowerCase(),
                              name: src,
                              description: s.description ?? "",
                              category: cat,
                              loginRequired: !!s.requires_connected_account,
                              autoApply: !!s.auto_apply_supported,
                              supportsJobs: (s.supports_opportunity_type ?? "both") !== "internship",
                              supportsInternships: (s.supports_opportunity_type ?? "both") !== "full-time",
                            };
                          })
                          .filter((s: any) => s.id && s.category === category)
                          .map((source: any) => (
                            <div
                              key={source.id}
                              className="flex items-center justify-between border border-border rounded-lg p-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{source.name}</span>
                                  {source.autoApply && (
                                    <StatusBadge variant="direct">Direct Apply</StatusBadge>
                                  )}
                                  {source.loginRequired && (
                                    <StatusBadge variant="account">
                                      Account Required
                                    </StatusBadge>
                                  )}
                                  {category === "coming_soon" && (
                                    <StatusBadge variant="neutral">Coming Soon</StatusBadge>
                                  )}
                                  {source.supportsInternships && (
                                    <StatusBadge variant="internship">Internships</StatusBadge>
                                  )}
                                  {source.supportsJobs && (
                                    <StatusBadge variant="job">Jobs</StatusBadge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {source.description}
                                </p>
                              </div>
                              <Switch
                                checked={selectedSources.has(source.name.toLowerCase())}
                                disabled={category === "coming_soon"}
                                onCheckedChange={(v) => {
                                  setPrefForm((p) => {
                                    const nextSet = new Set(
                                      (p.preferred_platforms ?? [])
                                        .filter((x): x is string => typeof x === "string")
                                        .map((x) => x.toLowerCase()),
                                    );

                                    if (v) nextSet.add(source.name.toLowerCase());
                                    else nextSet.delete(source.name.toLowerCase());

                                    const names = (sourceCaps ?? [])
                                      .map((s2: any) => (s2.source as string) || "")
                                      .filter((n: string) => n && nextSet.has(n.toLowerCase()));

                                    return { ...p, preferred_platforms: names };
                                  });
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="text-center space-y-6 py-8">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h2 className="text-xl font-bold">You're All Set!</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Your profile is ready. We'll start matching you with relevant jobs and internships from your selected sources.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-left max-w-sm mx-auto text-sm space-y-2">
                    <p>✅ Resume uploaded</p>
                    <p>✅ Profile data reviewed</p>
                    <p>✅ Preferences configured</p>
                    <p>✅ Answer bank filled</p>
                    <p>✅ Sources selected</p>
                  </div>

                  <Button
                    size="lg"
                    onClick={async () => {
                      if (!user?.id) return;

                      try {
                        await supabase.from("profiles").upsert({ id: user.id, ...profileForm });
                        await supabase.from("preferences").upsert({ user_id: user.id, ...prefForm });
                        await supabase.from("answer_bank").upsert({ user_id: user.id, ...answerForm });

                        await Promise.all(
                          prefForm.preferred_platforms.map((src) =>
                            supabase.from("connected_sources").upsert(
                              { user_id: user.id, source: src, is_connected: false },
                              { onConflict: "user_id,source" },
                            ),
                          ),
                        );

                        await supabase.functions.invoke("fetch-jobs", { body: { limit: 50 } });
                        await supabase.functions.invoke("score-jobs", { body: { user_id: user.id } });
                        await supabase.functions.invoke("build-queue", { body: { user_id: user.id } });

                        navigate("/dashboard");
                      } catch (e: any) {
                        toast({
                          title: "Setup failed",
                          description: e?.message ?? "Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="gap-2"
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 5 && (
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next} className="gap-2" disabled={step === 0 && !uploaded}>
              {step === 4 ? "Finish Setup" : "Continue"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}