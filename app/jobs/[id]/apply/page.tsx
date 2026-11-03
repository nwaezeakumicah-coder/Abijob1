
import { Suspense } from "react";
import JobApplicationClient from "./JobApplicationClient";

export default function JobApplicationPage() {
  return (
    <Suspense
      fallback={
        <main className="application-page">
          <div className="application-loading">
            <p>Loading your application...</p>
          </div>
        </main>
      }
    >
      <JobApplicationClient />
    </Suspense>
  );
}
