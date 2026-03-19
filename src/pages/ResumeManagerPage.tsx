import { MatchRing } from "@/components/ui/MatchRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Star, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function ResumeManagerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: resumes } = useQuery({
    queryKey: ["resumes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_name, is_primary, created_at, ats_score, file_path")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await supabase
        .from("resumes")
        .insert({
          user_id: user!.id,
          file_path: path,
          file_name: file.name,
          is_primary: resumes?.length ? false : true,
          ats_score: 65,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      return row;
    },
    onSuccess: async () => {
      toast({ title: "Resume uploaded" });
      await qc.invalidateQueries({ queryKey: ["resumes", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Upload failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      // two-step update to respect the partial unique index (one active per user)
      const { error: clearErr } = await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", user!.id);
      if (clearErr) throw clearErr;

      const { error: setErr } = await supabase
        .from("resumes")
        .update({ is_primary: true })
        .eq("id", resumeId)
        .eq("user_id", user!.id);
      if (setErr) throw setErr;
    },
    onSuccess: async () => {
      toast({ title: "Active resume updated" });
      await qc.invalidateQueries({ queryKey: ["resumes", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (resume: { id: string; file_path: string }) => {
      // best-effort storage cleanup; ignore if missing bucket/policy
      await supabase.storage.from("resumes").remove([resume.file_path]).catch(() => { });
      const { error } = await supabase.from("resumes").delete().eq("id", resume.id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Resume archived" });
      await qc.invalidateQueries({ queryKey: ["resumes", user?.id] });
    },
    onError: (e: any) => {
      toast({ title: "Archive failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const list = resumes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resume Manager</h1>
          <p className="text-sm text-muted-foreground">Manage your resume versions</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              uploadMutation.mutate(file);
              e.currentTarget.value = "";
            }}
          />
          <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((resume) => (
          <div key={resume.id} className={`bg-card border rounded-xl p-5 space-y-4 ${resume.is_primary ? "border-primary" : "border-border"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{resume.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {resume.is_primary && <StatusBadge variant="success">Active</StatusBadge>}
            </div>
            <MatchRing value={resume.ats_score ?? 0} size={56} strokeWidth={4} label="ATS Score" />
            <div className="flex gap-2">
              {!resume.is_primary && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => setActiveMutation.mutate(resume.id)}
                >
                  <Star className="h-3 w-3" /> Set Active
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => archiveMutation.mutate({ id: resume.id, file_path: resume.file_path })}
              >
                <Trash2 className="h-3 w-3" /> Archive
              </Button>
            </div>
          </div>
        ))}

        {/* Upload card */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[200px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">Upload New Resume</p>
          <p className="text-xs text-muted-foreground">PDF or DOCX</p>
        </div>
      </div>
    </div>
  );
}
