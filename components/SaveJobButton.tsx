"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SaveJobButton({ jobId }: { jobId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [roleAllowed, setRoleAllowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSavedState() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!active) return;
        setUserId(user.id);
        const allowed = profile?.role === "job_seeker" || profile?.role === "professional";
        setRoleAllowed(allowed);
        if (!allowed) return;
        const { data, error } = await supabase
          .from("saved_jobs")
          .select("id")
          .eq("user_id", user.id)
          .eq("job_id", jobId)
          .maybeSingle();
        if (error) throw error;
        if (active) setIsSaved(Boolean(data));
      } catch (error) {
        console.error("Could not load saved-job status:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadSavedState();
    return () => { active = false; };
  }, [jobId, supabase]);

  async function toggleSaved() {
    if (saving || loading) return;
    if (!userId) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?redirect=${encodeURIComponent(next)}`);
      return;
    }
    if (!roleAllowed) {
      setMessage("Saving jobs is available to job seekers and professionals.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = isSaved
        ? await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId)
        : await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
      if (result.error) throw result.error;
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Saved-job update failed:", error);
      setMessage(error instanceof Error ? error.message : "This job could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={`job-save-button ${isSaved ? "is-saved" : ""}`}
        onClick={() => void toggleSaved()}
        disabled={loading || saving}
        aria-label={isSaved ? "Remove saved job" : "Save job"}
      >
        <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        {loading ? "Loading..." : saving ? "Saving..." : isSaved ? "Saved" : "Save job"}
      </button>
      {message && <p role="status" className="job-save-message">{message}</p>}
    </div>
  );
}
