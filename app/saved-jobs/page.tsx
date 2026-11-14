import { redirect } from "next/navigation";

// The saved-jobs view is powered by the account-backed Saved tab on /jobs.
// Redirect instead of displaying the old hard-coded sample vacancies.
export default function SavedJobsPage() {
  redirect("/jobs?tab=Saved");
}
