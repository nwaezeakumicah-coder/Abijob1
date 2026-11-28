import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://abijob1.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/home", "/jobs", "/professionals", "/employers", "/about", "/faq", "/guidelines", "/privacy", "/terms", "/safety", "/contact", "/pricing"],
        // Include both exact route roots and nested paths. This is crawler guidance,
        // not an access-control mechanism; private routes remain protected by auth/RLS.
        disallow: [
          "/admin",
          "/dashboard",
          "/employer",
          "/professional",
          "/api/",
          "/auth/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/messages",
          "/notifications",
          "/settings",
          "/subscription",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
