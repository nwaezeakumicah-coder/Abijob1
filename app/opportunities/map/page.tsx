import Link from "next/link";
import { connection } from "next/server";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/server";
import { MapPin, BriefcaseBusiness, Users, ArrowRight } from "lucide-react";

export const instant = false;

type LgaRow = { lga: string; approved_jobs: number; public_professionals: number };
type MapSummary = { unassigned_approved_jobs: number; unassigned_public_professionals: number };

export default async function OpportunityMapPage() {
  // This route reads a request-scoped Supabase session. Defer rendering until
  // a request exists instead of trying to evaluate that session at build time.
  await connection();
  const supabase = await createClient();
  const [{ data, error }, { data: summaryData }] = await Promise.all([
    supabase.rpc("get_abia_opportunity_map"),
    supabase.rpc("get_abia_opportunity_map_summary"),
  ]);
  const rows = (Array.isArray(data) ? data : []) as LgaRow[];
  const summary = (Array.isArray(summaryData) ? summaryData[0] : summaryData) as MapSummary | null;
  const unassignedJobs = Number(summary?.unassigned_approved_jobs || 0);
  const unassignedProfessionals = Number(summary?.unassigned_public_professionals || 0);
  const totalJobs = rows.reduce((sum, row) => sum + Number(row.approved_jobs || 0), 0) + unassignedJobs;
  const totalProfessionals = rows.reduce((sum, row) => sum + Number(row.public_professionals || 0), 0) + unassignedProfessionals;

  return (
    <>
      <Header />
      <main className="opportunity-map">
        <section className="map-hero">
          <span>ABIA STATE · 17 LOCAL GOVERNMENT AREAS</span>
          <h1>Opportunity, across every part of Abia.</h1>
          <p>Explore approved vacancies and public professional profiles recorded by Abijob in each local government area.</p>
          <div className="map-totals">
            <div><BriefcaseBusiness size={20}/><strong>{totalJobs}</strong><span>Approved vacancies matched</span></div>
            <div><Users size={20}/><strong>{totalProfessionals}</strong><span>Public professionals matched</span></div>
          </div>
        </section>
        {error ? (
          <div className="map-state" role="alert">The opportunity map is temporarily unavailable. Please try again later.</div>
        ) : (
          <section className="lga-grid" aria-label="Opportunities by local government area">
            {rows.map((row) => (
              <article className="lga-card" key={row.lga}>
                <div className="lga-name"><MapPin size={17}/><h2>{row.lga}</h2></div>
                <div className="lga-metrics">
                  <div><strong>{Number(row.approved_jobs || 0)}</strong><span>Jobs</span></div>
                  <div><strong>{Number(row.public_professionals || 0)}</strong><span>Professionals</span></div>
                </div>
                <Link href={`/jobs?lga=${encodeURIComponent(row.lga)}`}>Explore opportunities <ArrowRight size={16}/></Link>
              </article>
            ))}
          </section>
        )}
        {!error && (unassignedJobs > 0 || unassignedProfessionals > 0) && (
          <section className="unassigned-location">
            <div><strong>Location needs more detail</strong><p>Some records use a town or broad area rather than a specific LGA, so Abijob will not guess which local government area they belong to.</p></div>
            <span>{unassignedJobs} vacancies · {unassignedProfessionals} professionals</span>
          </section>
        )}
        <p className="map-disclaimer">Counts are based on approved vacancies and public professional profiles whose recorded locations include the full LGA name. Broad locations such as “Aba” are reported separately until the correct LGA is supplied. Figures update as Abijob records grow; zero means no matching records were found, not that the area has no opportunities.</p>
      </main>
      <Footer />
      <style>{`
        .opportunity-map{background:#f7f8f3;color:#17251d;min-height:70vh;padding-bottom:64px}
        .map-hero{padding:66px max(22px,calc((100% - 1160px)/2));background:#103c2b;color:#fff}
        .map-hero>span{font-size:11px;letter-spacing:1.5px;font-weight:800;color:#d7f078}
        .map-hero h1{font-size:clamp(32px,5vw,54px);line-height:1.08;max-width:760px;margin:15px 0}
        .map-hero p{max-width:680px;color:#e1ebe3;line-height:1.7}
        .map-totals{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}
        .map-totals>div{display:grid;grid-template-columns:28px auto;column-gap:8px;align-items:center;background:#ffffff12;border:1px solid #ffffff26;padding:14px 18px;border-radius:12px;min-width:210px}
        .map-totals svg{grid-row:span 2;color:#d7f078}.map-totals strong{font-size:24px}.map-totals span{font-size:12px;color:#dbe6dd}
        .lga-grid{max-width:1160px;margin:34px auto;padding:0 20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .lga-card{background:#fff;border:1px solid #e4e9e1;border-radius:13px;padding:19px}
        .lga-name{display:flex;align-items:center;gap:9px;color:#176b45}.lga-name h2{font-size:17px;margin:0;color:#17251d}
        .lga-metrics{display:flex;gap:30px;margin:20px 0}.lga-metrics div{display:grid;gap:2px}.lga-metrics strong{font-size:25px}.lga-metrics span{font-size:12px;color:#69776d}
        .lga-card>a{display:inline-flex;align-items:center;gap:7px;color:#176b45;text-decoration:none;font-size:13px;font-weight:800}
        .map-state{max-width:1160px;margin:30px auto;padding:20px;background:#fff;border-radius:12px}
        .unassigned-location{max-width:1120px;margin:0 auto 22px;padding:16px 20px;background:#fff7e8;border:1px solid #f1dfb9;border-radius:10px;display:flex;justify-content:space-between;gap:15px;align-items:center}.unassigned-location p{margin:5px 0 0;color:#78623b;font-size:12px;line-height:1.6}.unassigned-location span{font-size:12px;font-weight:800;color:#8b5a12;white-space:nowrap}.map-disclaimer{max-width:1160px;margin:0 auto;padding:0 20px;color:#68766c;font-size:12px;line-height:1.7}
        @media(max-width:850px){.lga-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.map-hero{padding-top:48px;padding-bottom:48px}}
        @media(max-width:560px){.unassigned-location{margin-left:14px;margin-right:14px;flex-direction:column;align-items:flex-start}.lga-grid{grid-template-columns:1fr}.map-totals>div{flex:1}.lga-metrics{margin:15px 0}}
      `}</style>
    </>
  );
}
