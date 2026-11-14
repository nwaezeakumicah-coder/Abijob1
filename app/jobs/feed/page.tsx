import { redirect } from "next/navigation";

// Keep the established job-feed URL working while the personalized feed is completed.
// The existing approved-vacancy search remains the reliable destination for now.
export default function JobFeedPage() {
  redirect("/jobs");
}
