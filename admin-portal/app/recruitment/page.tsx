import Link from "next/link";
import { getActiveAdmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import AdminShell from "../../components/AdminShell";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3, FileText, Users } from "lucide-react";
import "./recruitment.css";

export const dynamic = "force-dynamic";

function formatDate(value:string){return new Intl.DateTimeFormat("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));}

export default async function RecruitmentPage(){
 const admin=await getActiveAdmin();
 if(!admin.permissions.includes("recruitment.view")){
  return <AdminShell><section className="recruitment-admin"><div className="recruitment-empty"><h1>Access restricted</h1><p>You do not have permission to view recruitment analytics.</p></div></section></AdminShell>;
 }
 const db=createAdminClient();
 const [interviews,upcoming,offers,awaiting,accepted,confirmed,records,recentOffers,recentInterviews]=await Promise.all([
  db.from("interviews").select("id",{count:"exact",head:true}),
  db.from("interviews").select("id",{count:"exact",head:true}).in("status",["scheduled","rescheduled"]).gte("scheduled_at",new Date().toISOString()),
  db.from("employment_offers").select("id",{count:"exact",head:true}),
  db.from("employment_offers").select("id",{count:"exact",head:true}).eq("status","sent"),
  db.from("employment_offers").select("id",{count:"exact",head:true}).eq("status","accepted"),
  db.from("employment_offers").select("id",{count:"exact",head:true}).eq("status","confirmed"),
  db.from("employment_records").select("id",{count:"exact",head:true}),
  db.from("employment_offers").select("id,job_title,status,created_at,expires_at,start_date").order("created_at",{ascending:false}).limit(8),
  db.from("interviews").select("id,scheduled_at,status,interview_type,duration_minutes").order("scheduled_at",{ascending:false}).limit(8)
 ]);
 const errors=[interviews,upcoming,offers,awaiting,accepted,confirmed,records,recentOffers,recentInterviews].filter(r=>r.error);
 if(errors.length)throw new Error("Recruitment analytics could not be loaded from the database.");
 const cards=[
  {label:"Interviews scheduled",value:interviews.count??0,icon:CalendarClock},
  {label:"Upcoming interviews",value:upcoming.count??0,icon:Users},
  {label:"Employment offers",value:offers.count??0,icon:FileText},
  {label:"Awaiting candidate response",value:awaiting.count??0,icon:Clock3},
  {label:"Offers accepted",value:accepted.count??0,icon:CheckCircle2},
  {label:"Confirmed hires",value:confirmed.count??0,icon:BriefcaseBusiness},
  {label:"Employment records",value:records.count??0,icon:BriefcaseBusiness}
 ];
 return <AdminShell><section className="recruitment-admin">
  <header className="recruitment-admin-header"><span>PLATFORM OVERSIGHT</span><h1>Recruitment & employment</h1><p>Live interview, offer and hiring activity from Abijob's production database. Private interview assessments are excluded.</p></header>
  <div className="recruitment-admin-grid">{cards.map(c=>{const Icon=c.icon;return <article key={c.label}><Icon size={20}/><span>{c.label}</span><strong>{c.value.toLocaleString("en-NG")}</strong></article>})}</div>
  <div className="recruitment-admin-columns">
   <section><div className="recruitment-admin-section-head"><div><h2>Recent employment offers</h2><p>Candidate names and private offer terms are not exposed in this overview.</p></div><FileText/></div>
   {(recentOffers.data||[]).length===0?<p className="recruitment-admin-empty">No employment offers have been issued.</p>:<div className="recruitment-admin-list">{recentOffers.data!.map(o=><article key={o.id}><div><strong>{o.job_title}</strong><span>{formatDate(o.created_at)}</span></div><span className={"recruitment-admin-status "+o.status}>{o.status}</span></article>)}</div>}
   </section>
   <section><div className="recruitment-admin-section-head"><div><h2>Recent interviews</h2><p>Appointment status and schedule.</p></div><CalendarClock/></div>
   {(recentInterviews.data||[]).length===0?<p className="recruitment-admin-empty">No interviews have been scheduled.</p>:<div className="recruitment-admin-list">{recentInterviews.data!.map(i=><article key={i.id}><div><strong>{formatDate(i.scheduled_at)}</strong><span>{i.interview_type.replaceAll("_"," ")} · {i.duration_minutes} minutes</span></div><span className={"recruitment-admin-status "+i.status}>{i.status}</span></article>)}</div>}
   </section>
  </div>
 </section></AdminShell>;
}

