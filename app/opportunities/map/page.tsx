import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { createClient } from "../../../lib/supabase/server";
import { MapPin, BriefcaseBusiness, Users, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type LgaRow = { lga: string; approved_jobs: number; public_professionals: number };

export default async function OpportunityMapPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_abia_opportunity_map");
  const rows = (Array.isArray(data) ? data : []) as LgaRow[];
  const totalJobs = rows.reduce((sum, row) => sum + Number(row.approved_jobs || 0), 0);
  const totalProfessionals = rows.reduce((sum, row) => sum + Number(row.public_professionals || 0), 0);

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
                <Link href="/jobs">Explore opportunities <ArrowRight size={16}/></Link>
              </article>
            ))}
          </section>
        )}
        <p className="map-disclaimer">Counts are based on approved vacancies and public professional profiles whose recorded locations include the full LGA name. Records labelled only with a town or city may not yet be assigned to an LGA. Figures update as Abijob records grow; zero means no matching records were found, not that the area has no opportunities.</p>
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
        .map-disclaimer{max-width:1160px;margin:0 auto;padding:0 20px;color:#68766c;font-size:12px;line-height:1.7}
        @media(max-width:850px){.lga-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.map-hero{padding-top:48px;padding-bottom:48px}}
        @media(max-width:560px){.lga-grid{grid-template-columns:1fr}.map-totals>div{flex:1}.lga-metrics{margin:15px 0}}
      `}</style>
    </>
  );
}
