"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/client";
import { BellRing, CheckCircle2, LoaderCircle, MapPin, BriefcaseBusiness } from "lucide-react";

const LGAS = ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isuikwuato","Obingwa","Ohafia","Osisioma Ngwa","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umunneochi"];

export default function JobAlertsSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/login?next=/settings/job-alerts"; return; }
      const id = auth.user.id;
      const [{ data: prefs, error: prefError }, { data: jobs }] = await Promise.all([
        supabase.from("job_alert_preferences").select("categories,locations,is_enabled").eq("user_id", id).maybeSingle(),
        supabase.from("jobs").select("category").eq("status", "approved").limit(500),
      ]);
      if (!active) return;
      if (prefError) setError("Your alert preferences could not be loaded.");
      setUserId(id);
      setCategories(Array.from(new Set((jobs || []).map((j: { category: string | null }) => j.category?.trim()).filter((v): v is string => Boolean(v)))).sort());
      if (prefs) {
        setSelectedCategories(prefs.categories || []);
        setSelectedLocations(prefs.locations || []);
        setEnabled(Boolean(prefs.is_enabled));
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [supabase]);

  function toggle(value: string, selected: string[], setter: (next: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    const { error: saveError } = await supabase.from("job_alert_preferences").upsert({
      user_id: userId,
      categories: selectedCategories,
      locations: selectedLocations,
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (saveError) setError("We couldn't save your preferences. Please try again.");
    else setMessage("Your job alert preferences have been saved.");
    setSaving(false);
  }

  return <>
    <Header />
    <main className="alerts-page">
      <div className="alerts-card">
        <span className="alerts-eyebrow"><BellRing size={16}/> PERSONAL JOB ALERTS</span>
        <h1>Let the right opportunities find you.</h1>
        <p>Choose the job categories and Abia locations you care about. When a matching vacancy is approved, Abijob will send an in-app notification.</p>
        {loading ? <div className="alerts-loading"><LoaderCircle className="spin"/> Loading your preferences…</div> : (
          <form onSubmit={save}>
            <label className="alerts-switch"><input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)}/><span><strong>Enable smart job alerts</strong><small>Turn notifications on or off at any time.</small></span></label>
            <section><h2><BriefcaseBusiness size={18}/> Job categories</h2><p className="alerts-help">Choose none to receive alerts for every category.</p>
              {categories.length ? <div className="alerts-options">{categories.map((item)=><label key={item}><input type="checkbox" checked={selectedCategories.includes(item)} onChange={()=>toggle(item,selectedCategories,setSelectedCategories)}/>{item}</label>)}</div> : <p className="alerts-help">No approved job categories are available yet. Leaving this empty will include all categories.</p>}
            </section>
            <section><h2><MapPin size={18}/> Local government areas</h2><p className="alerts-help">Choose none to receive alerts across all Abia State locations.</p>
              <div className="alerts-options">{LGAS.map((item)=><label key={item}><input type="checkbox" checked={selectedLocations.includes(item)} onChange={()=>toggle(item,selectedLocations,setSelectedLocations)}/>{item}</label>)}</div>
            </section>
            {message && <div className="alerts-success"><CheckCircle2 size={17}/>{message}</div>}
            {error && <p className="alerts-error" role="alert">{error}</p>}
            <button type="submit" disabled={saving || !userId}>{saving ? "Saving…" : "Save alert preferences"}</button>
          </form>
        )}
        <Link href="/jobs" className="alerts-back">Browse approved vacancies</Link>
      </div>
    </main>
    <Footer />
    <style>{`
      .alerts-page{min-height:65vh;background:#f7f8f3;padding:44px 18px;color:#17251d}.alerts-card{max-width:850px;margin:auto;background:#fff;border:1px solid #e5eae4;border-radius:16px;padding:clamp(22px,4vw,42px)}
      .alerts-eyebrow{display:flex;align-items:center;gap:8px;color:#176b45;font-size:11px;font-weight:800;letter-spacing:1.2px}.alerts-card h1{font-size:clamp(27px,4vw,40px);margin:13px 0}.alerts-card>p{color:#68766c;line-height:1.7;max-width:680px}
      .alerts-card form{display:grid;gap:26px;margin-top:28px}.alerts-switch{display:flex;align-items:center;gap:12px;padding:15px;background:#f2f7f0;border-radius:10px}.alerts-switch span{display:grid;gap:4px}.alerts-switch small,.alerts-help{color:#68766c;font-size:12px}
      .alerts-card section{border-top:1px solid #edf0eb;padding-top:20px}.alerts-card h2{display:flex;align-items:center;gap:8px;font-size:17px}.alerts-card h2 svg{color:#176b45}.alerts-help{margin-top:-7px}
      .alerts-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.alerts-options label{display:flex;align-items:center;gap:8px;font-size:13px;padding:9px;border:1px solid #e5eae4;border-radius:8px}
      .alerts-card input{accent-color:#176b45}.alerts-card button{justify-self:start;border:0;border-radius:8px;padding:13px 18px;background:#176b45;color:#fff;font-weight:800}.alerts-card button:disabled{opacity:.6}
      .alerts-success{display:flex;align-items:center;gap:8px;background:#edf7ef;color:#176b45;padding:12px;border-radius:8px}.alerts-error{color:#a33d20}.alerts-back{display:inline-block;margin-top:20px;color:#176b45;font-weight:700;font-size:13px}.alerts-loading{display:flex;align-items:center;gap:10px;padding:25px}
      .spin{animation:alerts-spin 1s linear infinite}@keyframes alerts-spin{to{transform:rotate(360deg)}}
      @media(max-width:600px){.alerts-options{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `}</style>
  </>;
}
