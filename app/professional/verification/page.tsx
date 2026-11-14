"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/client";
import { ShieldCheck, UploadCloud, CheckCircle2, Clock3 } from "lucide-react";

const TYPES = [
  ["government_id","Government-issued ID"],
  ["trade_certificate","Trade or skills certificate"],
  ["professional_license","Professional licence"],
  ["business_registration","Business registration"],
  ["other","Other supporting document"],
] as const;

type RequestRow = { id:string; credential_type:string; credential_name:string; status:string; admin_notes:string|null; created_at:string };

export default function ProfessionalVerificationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId,setUserId] = useState("");
  const [request,setRequest] = useState<RequestRow|null>(null);
  const [verified,setVerified] = useState(false);
  const [credentialType,setCredentialType] = useState<string>("government_id");
  const [credentialName,setCredentialName] = useState("");
  const [notes,setNotes] = useState("");
  const [file,setFile] = useState<File|null>(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  useEffect(()=>{ let active=true; async function load(){
    const {data:auth}=await supabase.auth.getUser();
    if(!auth.user){window.location.href="/login?next=/professional/verification";return;}
    const id=auth.user.id;
    const [{data:profile},{data:requests,error:requestError}]=await Promise.all([
      supabase.from("professional_profiles").select("verification_status").eq("user_id",id).maybeSingle(),
      supabase.from("professional_verification_requests").select("id,credential_type,credential_name,status,admin_notes,created_at").eq("professional_id",id).order("created_at",{ascending:false}).limit(1)
    ]);
    if(!active)return;
    setUserId(id); setVerified(profile?.verification_status==="verified");
    if(requestError)setError("Unable to load your verification history.");
    setRequest(requests?.[0]||null); setLoading(false);
  } void load(); return()=>{active=false};},[supabase]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");setMessage("");
    if(!file){setError("Choose a supporting document to upload.");setSaving(false);return;}
    if(file.size>5*1024*1024){setError("The document must be 5 MB or smaller.");setSaving(false);return;}
    const allowed=["application/pdf","image/jpeg","image/png","image/webp"];
    if(!allowed.includes(file.type)){setError("Upload a PDF, JPG, PNG or WEBP document.");setSaving(false);return;}
    const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
    const path=userId+"/"+crypto.randomUUID()+"-"+safeName;
    const {error:uploadError}=await supabase.storage.from("abijob-verification-files").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setError("The document could not be uploaded. Please try again.");setSaving(false);return;}
    const {data,error:insertError}=await supabase.from("professional_verification_requests").insert({
      professional_id:userId,credential_type:credentialType,credential_name:credentialName.trim(),document_path:path,notes:notes.trim()||null
    }).select("id,credential_type,credential_name,status,admin_notes,created_at").single();
    if(insertError){setError(insertError.code==="23505"?"You already have a pending verification request.":"Your request could not be submitted. Please contact support if the problem continues.");}
    else {setRequest(data as RequestRow);setMessage("Your verification documents have been submitted securely for review.");setFile(null);setCredentialName("");setNotes("");}
    setSaving(false);
  }

  return <><Header/><main className="professional-verification">
    <div className="pv-card">
      <span className="pv-eyebrow"><ShieldCheck size={17}/> PROFESSIONAL TRUST</span>
      <h1>Verify your professional profile</h1>
      <p>Submit a supporting document so Abijob administrators can review your professional identity or qualifications. Verification is reviewed by people; it is not automatic accreditation or a government licence.</p>
      {loading?<p>Loading your verification status…</p>:verified?<div className="pv-status approved"><CheckCircle2/> Your professional profile is verified.</div>:request?.status==="pending"?<div className="pv-status pending"><Clock3/> Your request is awaiting review.</div>:null}
      {request && <div className="pv-history"><strong>Latest submission: {request.credential_name}</strong><span>Status: {request.status}</span>{request.admin_notes&&<p>Review note: {request.admin_notes}</p>}</div>}
      {!loading&&!verified&&request?.status!=="pending"&&<form onSubmit={submit}>
        <label>Document type<select value={credentialType} onChange={e=>setCredentialType(e.target.value)}>{TYPES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
        <label>Document or credential name<input value={credentialName} onChange={e=>setCredentialName(e.target.value)} minLength={3} maxLength={160} required placeholder="e.g. National ID card, trade certificate"/></label>
        <label>Supporting document<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)} required/><small>Private upload · PDF/JPG/PNG/WEBP · Maximum 5 MB</small></label>
        <label>Additional information (optional)<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={3}/></label>
        {error&&<p className="pv-error" role="alert">{error}</p>}{message&&<p className="pv-success"><CheckCircle2 size={17}/>{message}</p>}
        <button disabled={saving}>{saving?"Submitting…":<><UploadCloud size={17}/> Submit for verification</>}</button>
      </form>}
      <Link href="/professional/dashboard" className="pv-back">Back to professional dashboard</Link>
    </div>
  </main><Footer/>
  <style>{`
    .professional-verification{min-height:65vh;background:#f7f8f3;padding:42px 18px;color:#17251d}.pv-card{max-width:760px;margin:auto;background:white;border:1px solid #e5eae4;border-radius:15px;padding:clamp(22px,4vw,40px)}
    .pv-eyebrow{display:flex;gap:8px;align-items:center;color:#176b45;font-size:11px;font-weight:800;letter-spacing:1.2px}.pv-card h1{font-size:clamp(27px,4vw,38px);margin:13px 0}.pv-card>p{color:#68766c;line-height:1.7}
    .pv-card form{display:grid;gap:16px;margin-top:25px}.pv-card label{display:grid;gap:7px;font-size:13px;font-weight:700}.pv-card input,.pv-card select,.pv-card textarea{width:100%;padding:11px;border:1px solid #dce4dc;border-radius:8px;background:white;color:#17251d}.pv-card small{color:#68766c;font-weight:400}
    .pv-card button{display:inline-flex;align-items:center;gap:8px;justify-self:start;border:0;border-radius:8px;background:#176b45;color:white;padding:12px 17px;font-weight:800}.pv-card button:disabled{opacity:.6}
    .pv-status,.pv-success{display:flex;align-items:center;gap:9px;padding:12px;border-radius:8px;margin:17px 0}.pv-status.approved,.pv-success{background:#edf7ef;color:#176b45}.pv-status.pending{background:#fff7e8;color:#96610b}.pv-history{display:grid;gap:5px;padding:13px;border:1px solid #e5eae4;border-radius:8px;font-size:13px}.pv-history span,.pv-history p{color:#68766c}.pv-error{color:#a33d20}.pv-back{display:inline-block;margin-top:20px;color:#176b45;font-weight:700;font-size:13px}
  `}</style></>;
}
