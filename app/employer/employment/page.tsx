"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3, FileText, LoaderCircle, RefreshCw, Send, Star, Users } from "lucide-react";
import "./employment.css";

type Application = { id:string; applicant_id:string; applicant_name:string|null; job_id:string; job_title:string };
type Offer = { id:string; application_id:string; applicant_id:string; applicant_name?:string; job_title:string; salary_amount:number; salary_currency:string; employment_type:string; work_location:string; start_date:string; expires_at:string; terms:string; status:string; issued_at:string };
type RecordRow = { id:string; employee_id:string; job_title:string; employment_type:string; salary_amount:number; salary_currency:string; work_location:string; start_date:string; status:string };
type Interview = { id:string; applicant_id:string; scheduled_at:string; status:string; applicant_name?:string; job_title?:string };
type Feedback = { interview_id:string; rating:number; recommendation:string; strengths:string; concerns:string; private_notes:string };

const money=(amount:number,currency:string)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:currency||"NGN",maximumFractionDigits:2}).format(Number(amount||0));
const date=(value:string)=>new Intl.DateTimeFormat("en-NG",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value));
const employmentTypes=[["full_time","Full-time"],["part_time","Part-time"],["contract","Contract"],["temporary","Temporary"],["internship","Internship"],["apprenticeship","Apprenticeship"]];

export default function EmployerEmploymentPage(){
 const supabase=useMemo(()=>createClient(),[]),router=useRouter();
 const [applications,setApplications]=useState<Application[]>([]),[offers,setOffers]=useState<Offer[]>([]),[records,setRecords]=useState<RecordRow[]>([]),[interviews,setInterviews]=useState<Interview[]>([]),[feedback,setFeedback]=useState<Record<string,Feedback>>({});
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[busy,setBusy]=useState(""),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const [applicationId,setApplicationId]=useState(""),[salary,setSalary]=useState(""),[currency,setCurrency]=useState("NGN"),[type,setType]=useState("full_time"),[location,setLocation]=useState(""),[startDate,setStartDate]=useState(""),[expiry,setExpiry]=useState(()=>{const d=new Date(Date.now()+7*86400000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}),[terms,setTerms]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/login?redirect=/employer/employment");return;}
   const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",user.id).single();
   if(profileError)throw profileError;if(profile?.role!=="employer"){router.replace(profile?.role==="professional"?"/professional/dashboard":"/dashboard");return;}
   const {data:jobs,error:jobsError}=await supabase.from("jobs").select("id,title").eq("employer_id",user.id);if(jobsError)throw jobsError;
   const jobMap=new Map((jobs||[]).map(j=>[j.id,j.title]));const ids=[...(jobs||[])].map(j=>j.id);
   let appRows:Application[]=[];
   if(ids.length){const {data,error:appError}=await supabase.from("job_applications").select("id,applicant_id,applicant_name,job_id").in("job_id",ids).eq("status","shortlisted").order("created_at",{ascending:false});if(appError)throw appError;appRows=(data||[]).map(a=>({...a,job_title:jobMap.get(a.job_id)||"Job vacancy"}));}
   const [offerResult,recordResult,interviewResult,feedbackResult]=await Promise.all([
    supabase.from("employment_offers").select("*").eq("employer_id",user.id).order("created_at",{ascending:false}),
    supabase.from("employment_records").select("*").eq("employer_id",user.id).order("start_date",{ascending:false}),
    supabase.from("interviews").select("id,application_id,applicant_id,scheduled_at,status").eq("employer_id",user.id).order("scheduled_at",{ascending:false}).limit(100),
    supabase.from("interview_feedback").select("interview_id,rating,recommendation,strengths,concerns,private_notes").eq("employer_id",user.id)
   ]);
   if(offerResult.error)throw offerResult.error;if(recordResult.error)throw recordResult.error;if(interviewResult.error)throw interviewResult.error;if(feedbackResult.error)throw feedbackResult.error;
   const appNames=new Map(appRows.map(a=>[a.id,a.applicant_name||"Applicant"]));
   setApplications(appRows);setOffers((offerResult.data||[]).map(o=>({...o,applicant_name:appNames.get(o.application_id)||"Applicant"})));
   setRecords((recordResult.data||[]) as RecordRow[]);
   setInterviews((interviewResult.data||[]).map(i=>({ ...i,applicant_name:appNames.get(i.application_id)||"Applicant",job_title:jobMap.get((appRows.find(a=>a.id===i.application_id)||{} as Application).job_id)||"Interview" })));
   setFeedback(Object.fromEntries((feedbackResult.data||[]).map(f=>[f.interview_id,f as Feedback])));
  }catch(e){setError(e instanceof Error?e.message:"Recruitment records could not be loaded.");}
  finally{setLoading(false);}
 },[router,supabase]);
 useEffect(()=>{void load()},[load]);
 async function issue(event:FormEvent){event.preventDefault();setError("");setSuccess("");if(saving)return;
  if(!applicationId||!salary||!location.trim()||!startDate||!expiry){setError("Complete all required offer details.");return;}
  const amount=Number(salary);const expiresAt=new Date(expiry);
  if(!Number.isFinite(amount)||amount<0||Number.isNaN(expiresAt.getTime())||expiresAt<=new Date()||expiresAt.getTime()>Date.now()+90*86400000){setError("Check the salary and offer expiry. Expiry must be within 90 days.");return;}
  setSaving(true);
  try{const {data,error}=await supabase.rpc("issue_employment_offer",{p_application_id:applicationId,p_salary_amount:amount,p_salary_currency:currency,p_employment_type:type,p_work_location:location.trim(),p_start_date:startDate,p_expires_at:expiresAt.toISOString(),p_terms:terms.trim()});if(error)throw error;if(!data)throw new Error("The offer was not created.");setSuccess("Employment offer sent to the candidate.");setApplicationId("");setSalary("");setLocation("");setStartDate("");setTerms("");await load();}
  catch(e){setError(e instanceof Error?e.message:"The employment offer could not be issued.");}finally{setSaving(false);}
 }
 async function confirmHire(id:string){if(!window.confirm("Confirm this accepted offer as a completed hiring decision? This will mark the application as hired and create an employment record."))return;setBusy(id);setError("");setSuccess("");try{const {data,error}=await supabase.rpc("confirm_employment_offer",{p_offer_id:id});if(error)throw error;if(!data)throw new Error("Hiring could not be confirmed.");setSuccess("Hiring confirmed and employment record created.");await load();}catch(e){setError(e instanceof Error?e.message:"Hiring confirmation failed.");}finally{setBusy("");}}
 async function saveFeedback(interviewId:string){const f=feedback[interviewId];if(!f||f.rating<1||f.rating>5){setError("Select an interview rating from 1 to 5.");return;}setBusy(interviewId);setError("");setSuccess("");try{const {error}=await supabase.rpc("save_interview_feedback",{p_interview_id:interviewId,p_rating:f.rating,p_recommendation:f.recommendation,p_strengths:f.strengths,p_concerns:f.concerns,p_private_notes:f.private_notes});if(error)throw error;setSuccess("Private interview assessment saved.");}catch(e){setError(e instanceof Error?e.message:"Interview assessment could not be saved.");}finally{setBusy("");}}
 function changeFeedback(id:string,key:keyof Feedback,value:string|number){setFeedback(old=>({ ...old,[id]:{interview_id:id,rating:3,recommendation:"hold",strengths:"",concerns:"",private_notes:"",...old[id],[key]:value}}));}
 return <main className="employment-page"><header className="employment-header"><Link href="/employer/dashboard"><ArrowLeft size={17}/> Employer dashboard</Link><span>RECRUITMENT WORKSPACE</span><h1>Employment & recruitment</h1><p>Issue offers, assess interviews and confirm hires using your real applicant records.</p></header>
 {error&&<div className="employment-alert error" role="alert">{error}</div>}{success&&<div className="employment-alert success"><CheckCircle2 size={17}/>{success}</div>}
 <div className="employment-toolbar"><div><strong>Live recruitment records</strong><span>Changes are saved to your Abijob account.</span></div><button onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/> Refresh</button></div>
 {loading?<div className="employment-loading"><LoaderCircle className="spin"/> Loading recruitment records…</div>:<>
 <section className="employment-stats"><article><Users/><span>Shortlisted candidates</span><strong>{applications.length}</strong></article><article><FileText/><span>Offers issued</span><strong>{offers.length}</strong></article><article><Clock3/><span>Awaiting response</span><strong>{offers.filter(o=>o.status==="sent").length}</strong></article><article><CheckCircle2/><span>Confirmed hires</span><strong>{records.length}</strong></article></section>
 <div className="employment-grid">
 <section className="employment-panel"><div className="employment-panel-title"><div><h2>Issue employment offer</h2><p>Only shortlisted applicants for your own vacancies are eligible.</p></div><Send/></div>
 {applications.length===0?<div className="employment-empty">No shortlisted applicants are currently eligible for an offer. Review applications and shortlist candidates first.</div>:<form onSubmit={issue} className="employment-form">
 <label>Candidate and vacancy<select required value={applicationId} onChange={e=>setApplicationId(e.target.value)}><option value="">Select shortlisted applicant</option>{applications.map(a=><option key={a.id} value={a.id}>{a.applicant_name||"Applicant"} — {a.job_title}</option>)}</select></label>
 <div className="employment-fields"><label>Salary amount<input type="number" min="0" step="0.01" required value={salary} onChange={e=>setSalary(e.target.value)} placeholder="e.g. 250000"/></label><label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="NGN">NGN — Naira</option><option value="USD">USD — US Dollar</option><option value="GBP">GBP — Pound Sterling</option><option value="EUR">EUR — Euro</option></select></label></div>
 <label>Employment type<select value={type} onChange={e=>setType(e.target.value)}>{employmentTypes.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
 <label>Work location<input required maxLength={500} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Office address or Remote"/></label>
 <div className="employment-fields"><label>Start date<input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label>Offer expires<input required type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/></label></div>
 <label>Offer terms and conditions<textarea maxLength={10000} rows={4} value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Working hours, benefits, probation, reporting line and other agreed conditions"/></label>
 <button className="employment-primary" disabled={saving}>{saving?<LoaderCircle className="spin"/>:<Send size={16}/>} {saving?"Sending offer…":"Send formal offer"}</button>
 </form>}</section>
 <section className="employment-panel"><div className="employment-panel-title"><div><h2>Employment offers</h2><p>Track candidate responses and confirm accepted offers.</p></div><FileText/></div>
 {offers.length===0?<div className="employment-empty">No employment offers have been issued yet.</div>:<div className="employment-list">{offers.map(o=><article key={o.id}><div className="employment-row-head"><div><strong>{o.applicant_name}</strong><span>{o.job_title}</span></div><span className={"employment-status "+o.status}>{o.status}</span></div><p>{money(o.salary_amount,o.salary_currency)} · {o.employment_type.replaceAll("_"," ")}</p><small>Start {date(o.start_date)} · Expires {date(o.expires_at)}</small>{o.terms&&<details><summary>Offer terms</summary><p>{o.terms}</p></details>}{o.status==="accepted"&&<button className="employment-primary" disabled={busy===o.id} onClick={()=>void confirmHire(o.id)}>{busy===o.id?"Confirming…":"Confirm hiring"}</button>}</article>)}</div>}</section>
 </div>
 <section className="employment-panel employment-wide"><div className="employment-panel-title"><div><h2>Interview assessments</h2><p>Private employer-only scorecards. Candidates cannot read these internal notes.</p></div><Star/></div>
 {interviews.length===0?<div className="employment-empty">Interview assessments will appear after you schedule candidate interviews.</div>:<div className="employment-list">{interviews.map(i=>{const f=feedback[i.id]||{interview_id:i.id,rating:3,recommendation:"hold",strengths:"",concerns:"",private_notes:""};return <article key={i.id}><div className="employment-row-head"><div><strong>{i.applicant_name}</strong><span>{i.job_title} · {date(i.scheduled_at)}</span></div><span className={"employment-status "+i.status}>{i.status}</span></div><div className="employment-fields"><label>Interview rating<select value={f.rating} onChange={e=>changeFeedback(i.id,"rating",Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label><label>Recommendation<select value={f.recommendation} onChange={e=>changeFeedback(i.id,"recommendation",e.target.value)}><option value="hire">Recommend hire</option><option value="hold">Hold for review</option><option value="reject">Do not proceed</option></select></label></div><label>Strengths<textarea rows={2} maxLength={5000} value={f.strengths} onChange={e=>changeFeedback(i.id,"strengths",e.target.value)} placeholder="Observed skills and strengths"/></label><label>Concerns<textarea rows={2} maxLength={5000} value={f.concerns} onChange={e=>changeFeedback(i.id,"concerns",e.target.value)} placeholder="Areas requiring follow-up"/></label><label>Private interviewer notes<textarea rows={2} maxLength={10000} value={f.private_notes} onChange={e=>changeFeedback(i.id,"private_notes",e.target.value)} placeholder="Internal notes visible only to this employer"/></label><button className="employment-primary" disabled={busy===i.id} onClick={()=>void saveFeedback(i.id)}>{busy===i.id?"Saving…":"Save private assessment"}</button></article>})}</div>}</section>
 <section className="employment-panel employment-wide"><div className="employment-panel-title"><div><h2>Employment records</h2><p>Confirmed hires become permanent employment records for both parties.</p></div><BriefcaseBusiness/></div>
 {records.length===0?<div className="employment-empty">No hires have been confirmed yet. An accepted offer becomes an employment record after you confirm hiring.</div>:<div className="employment-list">{records.map(r=><article key={r.id}><div className="employment-row-head"><div><strong>{r.job_title}</strong><span>{money(r.salary_amount,r.salary_currency)} · {r.employment_type.replaceAll("_"," ")}</span></div><span className={"employment-status "+r.status}>{r.status}</span></div><small>{r.work_location} · Starts {date(r.start_date)}</small></article>)}</div>}</section>
 </>}
 </main>
}
