import Link from "next/link";
import { CheckCircle2, Clock3, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import AdminShell from "../../../components/AdminShell";
import { getActiveAdmin } from "../../../lib/admin-auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import { reviewProfessionalVerification } from "./actions";

type RequestRow = {
  id: string; professional_id: string; credential_type: string; credential_name: string;
  document_path: string; notes: string | null; status: string; created_at: string;
  admin_notes: string | null; profiles: { full_name: string | null; location: string | null } | null;
};

export const dynamic = "force-dynamic";

export default async function ProfessionalVerificationsPage({
  searchParams,
}: { searchParams: Promise<{ success?: string; error?: string; page?: string }> }) {
  const admin = await getActiveAdmin();
  const canView = ["verifications.review", "verifications.manage"].some((key) => admin.permissions.includes(key));
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 50;
  if (!canView) return <AdminShell><main className="pvr"><h1>Access restricted</h1><p>You cannot review professional verification requests.</p></main></AdminShell>;

  const supabase = createAdminClient();
  const { data, error, count } = await supabase.from("professional_verification_requests")
    .select("id,professional_id,credential_type,credential_name,document_path,notes,status,created_at,admin_notes,profiles(full_name,location)", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error("Unable to load professional verification requests.");
  const requests = (data || []) as unknown as RequestRow[];
  const totalRequests = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRequests / pageSize));
  const rows = await Promise.all(requests.map(async (request) => {
    const { data: signed } = await supabase.storage.from("abijob-verification-files").createSignedUrl(request.document_path, 300);
    return { ...request, documentUrl: signed?.signedUrl || null };
  }));

  return <AdminShell><main className="pvr">
    <header><span>TRUST &amp; SAFETY</span><h1>Professional verification</h1><p>Review submitted identity and qualification evidence for Skilled Professionals &amp; Artisans.</p><Link href="/verifications">← Employer verifications</Link></header>
    {params.success&&<div className="pvr-flash good">{params.success}</div>}{params.error&&<div className="pvr-flash bad">{params.error}</div>}
    <div className="pvr-count"><ShieldCheck/> {requests.length} of {totalRequests} requests · Page {page} of {totalPages} · Documents are privately signed for five minutes.</div>
    {rows.length===0?<section className="pvr-empty"><FileCheck2 size={34}/><h2>No professional verification requests</h2><p>New submissions will appear here for review.</p></section>:<section className="pvr-list">
      {rows.map((request)=>{const profile=Array.isArray(request.profiles)?request.profiles[0]:request.profiles;return <article className="pvr-card" key={request.id}>
        <div className="pvr-top"><div><span>{request.credential_type.replaceAll("_"," ")}</span><h2>{request.credential_name}</h2><p>{profile?.full_name||"Professional"} · {profile?.location||"Location not supplied"}</p><small>{new Date(request.created_at).toLocaleString("en-NG")}</small></div><strong className={"pvr-status "+request.status}>{request.status}</strong></div>
        {request.notes&&<p>{request.notes}</p>}{request.admin_notes&&<p className="pvr-note">Previous review note: {request.admin_notes}</p>}
        {request.documentUrl?<a href={request.documentUrl} target="_blank" rel="noreferrer">Open private evidence document</a>:<span>Evidence link unavailable</span>}
        {request.status==="pending"&&<form action={reviewProfessionalVerification}><input type="hidden" name="requestId" value={request.id}/><input name="notes" maxLength={2000} placeholder="Review note (optional)"/><button name="status" value="approved"><CheckCircle2 size={15}/> Approve</button><button name="status" value="rejected" className="reject"><XCircle size={15}/> Reject</button></form>}
      </article>})}
    </section>}
    {totalPages > 1 && <nav className="pvr-pagination" aria-label="Professional verification pages">
      {page > 1 ? <Link href={`/verifications/professionals?page=${page - 1}`}>← Previous</Link> : <span>← Previous</span>}
      <b>Page {page} of {totalPages}</b>
      {page < totalPages ? <Link href={`/verifications/professionals?page=${page + 1}`}>Next →</Link> : <span>Next →</span>}
    </nav>}
  </main><style>{`
    .pvr{max-width:1150px;margin:auto;padding:30px;color:#17251d}.pvr header>span{font-size:11px;letter-spacing:1.5px;color:#176b45;font-weight:800}.pvr h1{font-size:30px;margin:8px 0}.pvr header p{color:#68766c}.pvr header>a,.pvr-card>a{color:#176b45;font-weight:700;font-size:13px}
    .pvr-count,.pvr-flash{display:flex;gap:9px;align-items:center;padding:13px;background:#f1f7f0;border-radius:9px;margin:20px 0}.pvr-flash.good{color:#176b45}.pvr-flash.bad{background:#fff1ed;color:#9a3412}
    .pvr-list{display:grid;gap:14px}.pvr-card,.pvr-empty{padding:19px;background:white;border:1px solid #e5eae4;border-radius:12px}.pvr-top{display:flex;justify-content:space-between;gap:15px}.pvr-top span{font-size:11px;text-transform:uppercase;color:#176b45;font-weight:800}.pvr-top h2{font-size:18px;margin:5px 0}.pvr-top p,.pvr-card>p,.pvr-card small{color:#68766c;font-size:13px}.pvr-status{height:max-content;padding:7px 10px;border-radius:20px;text-transform:capitalize;background:#fff5df;color:#96610b;font-size:12px}.pvr-status.approved{background:#edf7ef;color:#176b45}.pvr-status.rejected{background:#fff1ed;color:#9a3412}
    .pvr-note{padding:10px;background:#f7f8f3;border-radius:7px}.pvr-card form{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px;border-top:1px solid #edf0eb;padding-top:14px}.pvr-card form input{flex:1;min-width:200px;padding:10px;border:1px solid #dce4dc;border-radius:7px}.pvr-card form button{display:inline-flex;gap:6px;align-items:center;border:0;border-radius:7px;padding:9px 12px;background:#176b45;color:white;font-weight:700}.pvr-card form button.reject{background:#fff1ed;color:#9a3412}.pvr-empty{text-align:center;padding:50px}.pvr-pagination{display:flex;justify-content:center;align-items:center;gap:18px;padding:20px}.pvr-pagination a{color:#176b45;font-weight:700}.pvr-pagination span{color:#9aa59b}.pvr-empty svg{color:#176b45}
    @media(max-width:600px){.pvr{padding:20px 14px}.pvr-top{flex-direction:column}}
  `}</style></AdminShell>;
}
