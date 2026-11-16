import { redirect } from "next/navigation";

// The portal currently has no separate support-ticket data model.
// Route the existing Support navigation to the implemented Trust & Safety
// queue rather than exposing a dead link. A dedicated ticketing workflow is
// tracked separately and must not be represented as already implemented.
export default function SupportPage() {
  redirect("/job-reports");
}
