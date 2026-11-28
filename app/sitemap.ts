import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://abijob1.vercel.app").replace(/\/$/, "");

const publicRoutes = [
  { path: "/landing", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/home", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/jobs", priority: 0.95, changeFrequency: "hourly" as const },
  { path: "/professionals", priority: 0.85, changeFrequency: "daily" as const },
  { path: "/employers", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/guidelines", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/safety", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
