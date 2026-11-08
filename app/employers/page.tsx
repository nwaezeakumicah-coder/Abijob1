
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  MapPin,
  Globe,
  Search,
  RefreshCw,
  ArrowRight,
  Users,
} from "lucide-react";

import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase/client";

type Employer = {
  employer_id: string;
  business_name: string;
  business_type: string | null;
  company_size: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  active_job_count: number;
};

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [filteredEmployers, setFilteredEmployers] = useState<Employer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEmployers() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: requestError } = await (supabase as any)
        .rpc("get_public_employers");

      if (requestError) {
        throw requestError;
      }

      const results = (data ?? []) as Employer[];

      setEmployers(results);
      setFilteredEmployers(results);
    } catch (err) {
      console.error("Employer directory error:", err);

      setError(
        "We couldn't load employers at the moment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployers();
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      setFilteredEmployers(employers);
      return;
    }

    setFilteredEmployers(
      employers.filter((employer) => {
        return [
          employer.business_name,
          employer.business_type,
          employer.address,
          employer.description,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      })
    );
  }, [search, employers]);

  return (
    <main className="employers-page">
      <style jsx>{`
        .employers-page {
          min-height: 100vh;
          background: #f7f8f3;
          color: #17251d;
        }

        .employers-header {
          background: #ffffff;
          border-bottom: 1px solid #e7ebe5;
          padding: 17px 6%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .employers-header nav {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .employers-header nav a {
          color: #405047;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .employers-header nav a:hover {
          color: #176b45;
        }

        .employers-header .header-cta {
          background: #176b45;
          color: #ffffff;
          padding: 11px 17px;
          border-radius: 8px;
        }

        .employers-hero {
          background: #103c2b;
          color: #ffffff;
          padding: 76px 7% 82px;
        }

        .hero-content {
          max-width: 850px;
          margin: auto;
        }

        .hero-label {
          display: inline-block;
          color: #d7f078;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 17px;
        }

        .employers-hero h1 {
          font-size: clamp(35px, 5vw, 58px);
          line-height: 1.12;
          max-width: 760px;
          margin: 0 0 20px;
          letter-spacing: -1.8px;
        }

        .employers-hero p {
          max-width: 650px;
          color: #dce8df;
          line-height: 1.8;
          font-size: 16px;
          margin: 0;
        }

        .employers-main {
          max-width: 1200px;
          margin: auto;
          padding: 58px 6% 85px;
        }

        .directory-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 25px;
          margin-bottom: 27px;
        }

        .directory-heading h2 {
          margin: 0 0 8px;
          font-size: 27px;
          color: #17251d;
        }

        .directory-heading p {
          margin: 0;
          color: #6b776e;
          line-height: 1.6;
          font-size: 14px;
        }

        .directory-count {
          color: #176b45;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        .search-box {
          max-width: 580px;
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          border: 1px solid #dce4dc;
          border-radius: 10px;
          background: #ffffff;
          margin-bottom: 30px;
          color: #718076;
        }

        .search-box input {
          border: 0;
          outline: 0;
          background: transparent;
          width: 100%;
          font: inherit;
          color: #17251d;
          font-size: 14px;
        }

        .employers-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .employer-card {
          background: #ffffff;
          border: 1px solid #e5eae4;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          min-height: 290px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .employer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(16, 60, 43, 0.08);
        }

        .employer-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 19px;
        }

        .employer-logo {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          background: #edf4ed;
          color: #176b45;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .employer-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .employer-card h3 {
          margin: 0 0 5px;
          font-size: 17px;
          line-height: 1.4;
          color: #17251d;
          overflow-wrap: anywhere;
        }

        .employer-industry {
          color: #758178;
          font-size: 12px;
        }

        .employer-description {
          color: #68766c;
          font-size: 13px;
          line-height: 1.7;
          margin: 0 0 20px;
          flex: 1;
        }

        .employer-meta {
          display: flex;
          flex-direction: column;
          gap: 11px;
          margin-bottom: 20px;
        }

        .employer-meta span {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #657269;
          font-size: 12px;
        }

        .employer-meta :global(svg) {
          color: #176b45;
          flex-shrink: 0;
        }

        .employer-card-footer {
          padding-top: 17px;
          border-top: 1px solid #edf0eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .vacancy-count {
          color: #176b45;
          font-size: 12px;
          font-weight: 700;
        }

        .browse-jobs {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #176b45;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .browse-jobs:hover {
          color: #103c2b;
        }

        .directory-state {
          background: #ffffff;
          border: 1px solid #e5eae4;
          border-radius: 12px;
          padding: 45px 20px;
          text-align: center;
          color: #68766c;
        }

        .directory-state h3 {
          color: #17251d;
          margin: 13px 0 8px;
        }

        .directory-state p {
          font-size: 14px;
          line-height: 1.7;
        }

        .retry-button {
          margin-top: 12px;
          border: 0;
          border-radius: 8px;
          padding: 11px 17px;
          background: #176b45;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .employers-footer {
          background: #0a2b1d;
          color: #dce8df;
          padding: 25px 6%;
          text-align: center;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .employers-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .employers-header {
            padding: 15px 5%;
          }

          .employers-header nav {
            gap: 12px;
          }

          .employers-header nav a:not(.header-cta) {
            display: none;
          }

          .employers-hero {
            padding: 58px 6%;
          }

          .employers-main {
            padding: 42px 5% 65px;
          }

          .directory-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .employers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="employers-header">
        <Logo href="/" size="medium" />

        <nav>
          <Link href="/jobs">Find Jobs</Link>
          <Link href="/professionals">Find Professionals</Link>
          <Link href="/employers" className="header-cta">
            Employers
          </Link>
        </nav>
      </header>

      <section className="employers-hero">
        <div className="hero-content">
          <span className="hero-label">THE ABI JOB EMPLOYER DIRECTORY</span>

          <h1>Discover businesses creating opportunities.</h1>

          <p>
            Explore employers recruiting on Abi Job, learn about their
            businesses and discover opportunities across Abia State.
          </p>
        </div>
      </section>

      <section className="employers-main">
        <div className="directory-heading">
          <div>
            <h2>Employers on Abi Job</h2>
            <p>
              Businesses with approved vacancies currently listed on
              the platform.
            </p>
          </div>

          {!loading && !error && (
            <span className="directory-count">
              {filteredEmployers.length}{" "}
              {filteredEmployers.length === 1 ? "employer" : "employers"}
            </span>
          )}
        </div>

        <div className="search-box">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, industry or location..."
            aria-label="Search employers"
          />
        </div>

        {loading && (
          <div className="directory-state" role="status">
            <RefreshCw size={25} />
            <h3>Loading employers</h3>
            <p>Finding businesses with approved vacancies...</p>
          </div>
        )}

        {!loading && error && (
          <div className="directory-state" role="alert">
            <Building2 size={30} />
            <h3>Unable to load employers</h3>
            <p>{error}</p>

            <button className="retry-button" onClick={loadEmployers}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredEmployers.length === 0 && (
          <div className="directory-state">
            <Building2 size={32} />

            <h3>
              {search
                ? "No matching employers found"
                : "No employers to display yet"}
            </h3>

            <p>
              {search
                ? "Try another company name, industry or location."
                : "Employers will appear here when they have approved vacancies on Abi Job."}
            </p>
          </div>
        )}

        {!loading && !error && filteredEmployers.length > 0 && (
          <div className="employers-grid">
            {filteredEmployers.map((employer) => (
              <article
                className="employer-card"
                key={employer.employer_id}
              >
                <div className="employer-card-top">
                  <div className="employer-logo">
                    {employer.logo_url ? (
                      <img
                        src={employer.logo_url}
                        alt={`${employer.business_name} logo`}
                      />
                    ) : (
                      <Building2 size={27} />
                    )}
                  </div>

                  <div>
                    <h3>{employer.business_name}</h3>

                    <span className="employer-industry">
                      {employer.business_type || "Business"}
                    </span>
                  </div>
                </div>

                <p className="employer-description">
                  {employer.description
                    ? employer.description.length > 145
                      ? `${employer.description.slice(0, 145)}...`
                      : employer.description
                    : "Discover this employer and explore the opportunities available on Abi Job."}
                </p>

                <div className="employer-meta">
                  {employer.address && (
                    <span>
                      <MapPin size={15} />
                      {employer.address}
                    </span>
                  )}

                  {employer.company_size && (
                    <span>
                      <Users size={15} />
                      {employer.company_size}
                    </span>
                  )}

                  {employer.website && (
                    <span>
                      <Globe size={15} />
                      Company website available
                    </span>
                  )}
                </div>

                <div className="employer-card-footer">
                  <span className="vacancy-count">
                    <BriefcaseBusiness
                      size={14}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 5,
                      }}
                    />
                    {employer.active_job_count} approved{" "}
                    {employer.active_job_count === 1
                      ? "vacancy"
                      : "vacancies"}
                  </span>

                  <Link href="/jobs" className="browse-jobs">
                    Browse jobs
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="employers-footer">
        Abi Job — Opportunity Starts Here.
      </footer>
    </main>
  );
}
