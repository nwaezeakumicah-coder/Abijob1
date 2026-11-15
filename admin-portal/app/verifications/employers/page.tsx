import Link from "next/link";
import {CheckCircle2,FileCheck2,ShieldCheck,XCircle} from "lucide-react";
import AdminShell from "../../../components/AdminShell";
import {getActiveAdmin} from "../../../lib/admin-auth";
import {createAdminClient} from "../../../lib/supabase/admin";
import {reviewEmployerEvidence} from "./actions";

type RequestRow={
 id:string;
 employer_id:string;
 document_type:string;
 document_name:string;
 document_path:string;
 notes:string|null;
 status:string;
 created_at:string;
 admin_notes:string|null;
 business_name:string|null;
};

export const dynamic="force-dynamic";

export default async function EmployerEvidencePage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const admin=await getActiveAdmin(),params=await searchParams;
 if(!["verifications.review","verifications.manage","employers.manage"].some(k=>admin.permissions.includes(k)))return <AdminShell><main className="eve-page"><h1>Access restricted</h1></main></AdminShell>;

 const supabase=createAdminClient();
 const {data,error}=await supabase
  .from("employer_verification_requests")
  .select("id,employer_id,document_type,document_name,document_path,notes,status,created_at,admin_notes")
  .order("created_at",{ascending:false})
  .limit(200);

 if(error){
  console.error("Employer evidence request query failed:",error.code,error.message);
  throw new Error("Unable to load employer evidence requests.");
 }

 const requests=(data||[]) as Omit<RequestRow,"business_name">[];
 const employerIds=[...new Set(requests.map(r=>r.employer_id))];
 const businessNames=new Map<string,string|null>();

 if(employerIds.length){
  const {data:employers,error:employerError}=await supabase
   .from("employer_profiles")
   .select("user_id,business_name")
   .in("user_id",employerIds);

  if(employerError){
   console.error("Employer profile lookup failed:",employerError.code,employerError.message);
   throw new Error("Unable to load employer business names.");
  }

  for(const employer of employers||[]) businessNames.set(employer.user_id,employer.business_name);
 }

 const rows=await Promise.all(requests.map(async r=>{
  const {data:signed,error:signedError}=await supabase.storage.from("abijob-verification-files").createSignedUrl(r.document_path,300);
  if(signedError) console.error("Employer evidence signed URL failed:",r.id,signedError.message);
  return {...r,business_name:businessNames.get(r.employer_id)||null,url:signed?.signedUrl||null};
 }));

 return <AdminShell><main className="eve-page"><header><span>TRUST &amp; SAFETY</span><h1>Employer evidence review</h1><p>Inspect private business documents before approving employer verification.</p><Link href="/verifications">← Verification centre</Link></header>{params.success&&<p className="eve-good">{params.success}</p>}{params.error&&<p className="eve-bad">{params.error}</p>}<p className="eve-count"><ShieldCheck/> {rows.length} requests loaded · Private document links expire after five minutes.</p>{rows.length===0?<section className="eve-empty"><FileCheck2 size={34}/><h2>No evidence requests yet</h2></section>:<section className="eve-list">{rows.map(r=><article key={r.id}><div className="eve-top"><div><span>{r.document_type.replaceAll("_"," ")}</span><h2>{r.document_name}</h2><p>{r.business_name||"Employer"} · {new Date(r.created_at).toLocaleString("en-NG")}</p></div><b className={"eve-status "+r.status}>{r.status}</b></div>{r.notes&&<p>{r.notes}</p>}{r.admin_notes&&<p className="eve-note">Previous note: {r.admin_notes}</p>}{r.url?<a href={r.url} target="_blank" rel="noreferrer">Open private evidence document</a>:<span>Evidence link unavailable</span>}{r.status==="pending"&&<form action={reviewEmployerEvidence}><input type="hidden" name="requestId" value={r.id}/><input name="notes" maxLength={2000} placeholder="Review note (optional)"/><button name="status" value="approved"><CheckCircle2 size={15}/> Approve</button><button name="status" value="rejected" className="eve-reject"><XCircle size={15}/> Reject</button></form>}</article>)}</section>}</main><style>{`.eve-page{max-width:1150px;margin:auto;padding:30px;color:#17251d}.eve-page header>span{font-size:11px;font-weight:800;letter-spacing:1.5px;color:#176b45}.eve-page h1{font-size:30px;margin:8px 0}.eve-page header p{color:#68766c}.eve-page header>a,.eve-list article>a{color:#176b45;font-weight:700;font-size:13px}.eve-count,.eve-good,.eve-bad{display:flex;gap:8px;align-items:center;padding:12px;background:#f1f7f0;border-radius:8px;margin:18px 0}.eve-good{color:#176b45}.eve-bad{background:#fff1ed;color:#9a3412}.eve-list{display:grid;gap:14px}.eve-list article,.eve-empty{background:#fff;border:1px solid #e5eae4;border-radius:12px;padding:19px}.eve-top{display:flex;justify-content:space-between;gap:15px}.eve-top span{font-size:11px;text-transform:uppercase;color:#176b45;font-weight:800}.eve-top h2{font-size:18px;margin:5px 0}.eve-top p,.eve-list article>p{color:#68766c;font-size:13px}.eve-status{padding:6px 9px;border-radius:20px;height:max-content;text-transform:capitalize;background:#fff5df;color:#96610b;font-size:11px}.eve-status.approved{background:#edf7ef;color:#176b45}.eve-status.rejected{background:#fff1ed;color:#9a3412}.eve-note{background:#f7f8f3;padding:9px;border-radius:7px}.eve-list form{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid #edf0eb}.eve-list form input{flex:1;min-width:200px;padding:10px;border:1px solid #dce4dc;border-radius:7px}.eve-list form button{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:7px;padding:9px 12px;background:#176b45;color:white;font-weight:700}.eve-list form button.eve-reject{background:#fff1ed;color:#9a3412}.eve-empty{text-align:center;padding:45px}.eve-empty svg{color:#176b45}@media(max-width:600px){.eve-page{padding:20px 14px}.eve-top{flex-direction:column}}`}</style></AdminShell>;
}
