"use server";
import {revalidatePath} from "next/cache";
import {getActiveAdmin} from "../../lib/admin-auth";
import {createAdminClient} from "../../lib/supabase/admin";
export async function reviewCommunityReport(formData:FormData){
 const admin=await getActiveAdmin();
 if(!admin.permissions.includes("communities.manage")&&!admin.permissions.includes("content.review"))throw new Error("You do not have permission to moderate community content.");
 const reportId=String(formData.get("report_id")??""),status=String(formData.get("status")??""),hide=formData.get("hide_content")==="true";
 if(!/^[0-9a-f-]{36}$/i.test(reportId)||!["reviewing","resolved","dismissed"].includes(status))throw new Error("Invalid moderation request.");
 const {error}=await createAdminClient().rpc("admin_review_community_report",{p_admin_id:admin.id,p_report_id:reportId,p_status:status,p_hide_content:hide});
 if(error)throw new Error(error.message||"Report could not be reviewed.");
 revalidatePath("/communities");
}