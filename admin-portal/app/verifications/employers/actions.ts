"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {getActiveAdmin} from "../../../lib/admin-auth";
import {createAdminClient} from "../../../lib/supabase/admin";
export async function reviewEmployerEvidence(formData:FormData){
 const admin=await getActiveAdmin();
 if(!["verifications.review","verifications.manage","employers.manage"].some(k=>admin.permissions.includes(k)))redirect("/verifications/employers?error=Access%20denied");
 const requestId=String(formData.get("requestId")||"").trim(),status=String(formData.get("status")||"").trim(),notes=String(formData.get("notes")||"").trim();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||!["approved","rejected"].includes(status)||notes.length>2000)redirect("/verifications/employers?error=Invalid%20review%20request");
 const supabase=createAdminClient();
 const {data,error}=await supabase.rpc("admin_review_employer_verification",{p_admin_id:admin.id,p_request_id:requestId,p_status:status,p_admin_notes:notes||null});
 if(error||data!==true){console.error("EMPLOYER EVIDENCE REVIEW FAILED:",error);redirect("/verifications/employers?error=Unable%20to%20update%20this%20request");}
 revalidatePath("/verifications/employers");revalidatePath("/verifications");redirect("/verifications/employers?success=Verification%20decision%20saved");
}