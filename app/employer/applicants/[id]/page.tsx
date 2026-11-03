
import { Suspense } from "react";
import { connection } from "next/server";
import ApplicantDetailsClient from "./ApplicantDetailsClient";

async function ApplicantDetailsContent() {
  await connection();

  return <ApplicantDetailsClient />;
}

export default function ApplicantDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="applicant-details-page">
          <div className="applicant-details-container">
            <p>Loading applicant information...</p>
          </div>
        </main>
      }
    >
      <ApplicantDetailsContent />
    </Suspense>
  );
}
