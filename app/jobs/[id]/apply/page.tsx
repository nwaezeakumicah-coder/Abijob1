import { Suspense } from "react";
import JobApplicationClient from "./JobApplicationClient";

export default function JobApplicationPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p>Loading application form...</p>
        </main>
      }
    >
      <JobApplicationClient />
    </Suspense>
  );
}