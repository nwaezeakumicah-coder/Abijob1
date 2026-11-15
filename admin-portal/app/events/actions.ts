"use server";
import {revalidatePath} from "next/cache";
import {getActiveAdmin} from "../../lib/admin-auth";
import {createAdminClient} from "../../lib/supabase/admin";
function canManage(admin:{permissions:string[]}){if(!admin.permissions.includes("events.manage"))throw new Error("You do not have permission to manage events.");}
function parseLagosDate(value:string){if(!value)return null;const parsed=new Date(value+":00+01:00");return Number.isNaN(parsed.getTime())?null:parsed.toISOString();}
export async function createCareerEvent(formData:FormData){
 const admin=await getActiveAdmin();canManage(admin);
 const title=String(formData.get("title")??"").trim(),description=String(formData.get("description")??"").trim();
 const eventType=String(formData.get("event_type")??""),startsAt=parseLagosDate(String(formData.get("starts_at")??"")),endsAt=parseLagosDate(String(formData.get("ends_at")??""));
 const venue=String(formData.get("venue")??"").trim(),meetingUrl=String(formData.get("meeting_url")??"").trim();
 const capacityText=String(formData.get("capacity")??"").trim(),capacity=capacityText?Number(capacityText):null;
 if(!startsAt||!endsAt||new Date(startsAt)<=new Date()||new Date(endsAt)<=new Date(startsAt))throw new Error("Choose a valid future start and end time.");
 if(title.length<5||description.length<20)throw new Error("Provide a clear title and description.");
 if(!["online","in_person","hybrid"].includes(eventType))throw new Error("Choose a valid event format.");
 if(["online","hybrid"].includes(eventType)){try{const u=new URL(meetingUrl);if(u.protocol!=="https:")throw new Error();}catch{throw new Error("Online events require a valid HTTPS meeting link.");}}
 if(["in_person","hybrid"].includes(eventType)&&venue.length<3)throw new Error("Provide the event venue.");
 if(capacity!==null&&(!Number.isInteger(capacity)||capacity<1||capacity>100000))throw new Error("Enter a valid capacity.");
 const deadlineText=String(formData.get("registration_deadline")??"").trim();
 const deadline=deadlineText?parseLagosDate(deadlineText):null;
 if(deadline&&new Date(deadline)>=new Date(startsAt))throw new Error("Registration deadline must be before the event starts.");
 const client=createAdminClient();
 const {error}=await client.rpc("admin_create_career_event",{p_admin_id:admin.id,p_title:title,p_description:description,p_event_type:eventType,p_starts_at:startsAt,p_ends_at:endsAt,p_timezone:"Africa/Lagos",p_venue:venue||null,p_meeting_url:meetingUrl||null,p_capacity:capacity,p_registration_deadline:deadline,p_publish:formData.get("publish")==="true"});
 if(error){console.error("CREATE CAREER EVENT",error);throw new Error(error.message||"Event could not be saved.");}
 revalidatePath("/events");revalidatePath("/hub/events");
}
export async function setCareerEventStatus(formData:FormData){
 const admin=await getActiveAdmin();canManage(admin);
 const eventId=String(formData.get("event_id")??""),status=String(formData.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(eventId)||!["draft","published","cancelled","completed"].includes(status))throw new Error("Invalid event update.");
 const {error}=await createAdminClient().rpc("admin_set_career_event_status",{p_admin_id:admin.id,p_event_id:eventId,p_status:status});
 if(error)throw new Error(error.message||"Event status could not be updated.");
 revalidatePath("/events");revalidatePath("/hub/events");
}
export async function markEventAttendance(formData:FormData){
 const admin=await getActiveAdmin();canManage(admin);
 const registrationId=String(formData.get("registration_id")??""),status=String(formData.get("status")??"");
 if(!/^[0-9a-f-]{36}$/i.test(registrationId)||!["attended","no_show"].includes(status))throw new Error("Invalid attendance update.");
 const {error}=await createAdminClient().rpc("admin_mark_career_event_attendance",{p_admin_id:admin.id,p_registration_id:registrationId,p_status:status});
 if(error)throw new Error(error.message||"Attendance could not be recorded.");
 revalidatePath("/events");
}
