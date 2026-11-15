import AdminShell from "../../components/AdminShell";
import {getActiveAdmin} from "../../lib/admin-auth";
import {createAdminClient} from "../../lib/supabase/admin";
import {createCareerEvent,setCareerEventStatus,markEventAttendance} from "./actions";
import "./events.css";
export const dynamic="force-dynamic";
function date(value:string){return new Date(value).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Lagos"});}
export default async function EventsAdminPage(){
 const admin=await getActiveAdmin();
 if(!admin.permissions.includes("events.manage"))return <AdminShell><main className="event-admin"><h1>Access restricted</h1><p>You do not have permission to manage career events.</p></main></AdminShell>;
 const db=createAdminClient();
 const [{data:events,error:eventError},{data:registrations,error:registrationError}]=await Promise.all([
  db.from("career_events").select("id,title,event_type,starts_at,ends_at,status,capacity,venue").order("starts_at",{ascending:false}).limit(100),
  db.from("career_event_registrations").select("id,event_id,user_id,status,registered_at").order("registered_at",{ascending:false}).limit(1000)
 ]);
 const rows=events??[],signups=registrations??[];
 const attendeeIds=Array.from(new Set(signups.map(r=>r.user_id)));
 const {data:attendees}=attendeeIds.length?await db.from("profiles").select("id,full_name").in("id",attendeeIds):{data:[]};
 const attendeeNames=new Map((attendees??[]).map(person=>[person.id,person.full_name]));
 const counts=new Map<string,number>();for(const r of signups)if(["registered","attended"].includes(r.status))counts.set(r.event_id,(counts.get(r.event_id)??0)+1);
 return <AdminShell><main className="event-admin"><header><span>CAREER HUB MANAGEMENT</span><h1>Events & workshops</h1><p>Create real events, publish verified details and manage participant registration and attendance. The attendee list below shows the latest 1,000 registrations.</p></header>
 <section className="event-admin-form"><h2>Create an event</h2><p>Online events require a real HTTPS meeting link. Save as draft until details are confirmed.</p><form action={createCareerEvent}>
 <label>Event title<input name="title" required minLength={5} maxLength={160}/></label>
 <label>Description<textarea name="description" required minLength={20} maxLength={5000} rows={4}/></label>
 <label>Format<select name="event_type" defaultValue="online"><option value="online">Online</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option></select></label>
 <div className="event-admin-two"><label>Starts (Nigeria time)<input name="starts_at" type="datetime-local" required/></label><label>Ends (Nigeria time)<input name="ends_at" type="datetime-local" required/></label></div>
 <div className="event-admin-two"><label>Venue (required for in-person/hybrid)<input name="venue" maxLength={250}/></label><label>HTTPS meeting link (required for online/hybrid)<input name="meeting_url" type="url" placeholder="https://…"/></label></div>
 <div className="event-admin-two"><label>Registration deadline (optional)<input name="registration_deadline" type="datetime-local"/></label><label>Capacity (optional)<input name="capacity" type="number" min="1" max="100000"/></label></div>
 <div className="event-admin-form-actions"><button name="publish" value="false" type="submit" className="secondary">Save draft</button><button name="publish" value="true" type="submit">Publish event</button></div>
 </form></section>
 <section className="event-admin-list"><h2>Published and scheduled events</h2>{eventError?<p>Events could not be loaded.</p>:rows.length===0?<p>No events have been created yet.</p>:rows.map(e=><article className="event-admin-card" key={e.id}><div className="event-admin-card-head"><div><span className={"event-admin-status "+e.status}>{e.status}</span><h3>{e.title}</h3><p>{e.event_type.replace("_"," ")} · {date(e.starts_at)} – {date(e.ends_at)}</p><small>{counts.get(e.id)??0} active registrations in recent records{e.capacity?" / "+e.capacity:""} {e.venue?" · "+e.venue:""}</small></div><form action={setCareerEventStatus}><input type="hidden" name="event_id" value={e.id}/><select name="status" defaultValue={e.status}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select><button type="submit" className="secondary">Update</button></form></div>
 {registrationError?<small>Registration records could not be loaded.</small>:signups.filter(r=>r.event_id===e.id).length>0&&<details><summary>Manage participants ({signups.filter(r=>r.event_id===e.id).length})</summary><div className="event-admin-attendees">{signups.filter(r=>r.event_id===e.id).map(r=><div key={r.id}><span>{attendeeNames.get(r.user_id)||"Abijob member"} · {r.status}</span>{new Date(e.ends_at)<=new Date()&&<form action={markEventAttendance}><input type="hidden" name="registration_id" value={r.id}/><button name="status" value="attended" type="submit" className="secondary">Attended</button><button name="status" value="no_show" type="submit" className="secondary">No-show</button></form>}</div>)}</div></details>}</article>)}</section>
 </main></AdminShell>;
}
