import AdminShell from "../../components/AdminShell";
import {getActiveAdmin} from "../../lib/admin-auth";
import {createAdminClient} from "../../lib/supabase/admin";
import {reviewCommunityReport} from "./actions";
import "./communities.css";
export const dynamic="force-dynamic";
export default async function CommunityModerationPage(){
 const admin=await getActiveAdmin();
 const allowed=admin.permissions.includes("communities.manage")||admin.permissions.includes("content.review");
 if(!allowed)return <AdminShell><main className="community-admin"><h1>Access restricted</h1><p>You do not have permission to moderate communities.</p></main></AdminShell>;
 const db=createAdminClient();
 const {data:reports,error}=await db.from("community_content_reports").select("id,reporter_id,post_id,comment_id,reason,details,status,created_at").order("created_at",{ascending:false}).limit(100);
 const postIds=(reports??[]).map(r=>r.post_id).filter(Boolean) as string[];
 const commentIds=(reports??[]).map(r=>r.comment_id).filter(Boolean) as string[];
 const [{data:posts},{data:comments}]=await Promise.all([
  postIds.length?db.from("community_posts").select("id,title,body,status").in("id",postIds):Promise.resolve({data:[]}),
  commentIds.length?db.from("community_comments").select("id,body,status").in("id",commentIds):Promise.resolve({data:[]})
 ]);
 const postMap=new Map((posts??[]).map(p=>[p.id,p])),commentMap=new Map((comments??[]).map(c=>[c.id,c]));
 return <AdminShell><main className="community-admin"><header><span>CAREER HUB MODERATION</span><h1>Community reports</h1><p>Review member reports and hide content that breaches Abijob community guidelines. Every decision is recorded in the administrator audit log.</p></header>
 {error?<p>Reports could not be loaded.</p>:!reports?.length?<div className="community-admin-empty"><h2>No reports to review</h2><p>New member reports will appear here.</p></div>:<section className="community-admin-list">{reports.map(r=>{const post=r.post_id?postMap.get(r.post_id):null,comment=r.comment_id?commentMap.get(r.comment_id):null;return <article key={r.id}><div className="community-admin-meta"><span className={"community-report-status "+r.status}>{r.status}</span><small>{new Date(r.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</small></div><h2>{post?.title??(comment?"Reported comment":"Content no longer available")}</h2><p>{post?.body??comment?.body??"The reported content may have been removed."}</p><div className="community-admin-details"><span>Reason: {r.reason.replaceAll("_"," ")}</span><span>Reporter: {r.reporter_id.slice(0,8)}…</span><span>Content: {post?"Post":comment?"Comment":"Unavailable"}</span></div>
 {r.status!=="resolved"&&r.status!=="dismissed"&&<form action={reviewCommunityReport}><input type="hidden" name="report_id" value={r.id}/><label><input type="checkbox" name="hide_content" value="true"/> Hide reported content if resolving</label><div><button name="status" value="reviewing" type="submit" className="secondary">Mark reviewing</button><button name="status" value="dismissed" type="submit" className="secondary">Dismiss</button><button name="status" value="resolved" type="submit">Resolve report</button></div></form>}</article>})}</section>}
 </main></AdminShell>;
}