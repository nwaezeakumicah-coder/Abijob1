"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import "./BackNavigation.css";

function getFallbackPath(pathname: string): string {
  if (pathname === "/home" || pathname === "/landing" || pathname === "/") return "/home";

  if (pathname === "/dashboard") return "/home";
  if (pathname.startsWith("/dashboard/")) return "/dashboard";

  if (pathname === "/employer/dashboard") return "/home";
  if (pathname.startsWith("/employer/")) return "/employer/dashboard";

  if (pathname === "/professional/dashboard") return "/home";
  if (pathname.startsWith("/professional/")) return "/professional/dashboard";

  if (pathname === "/admin") return "/home";
  if (pathname.startsWith("/admin/")) return "/admin";

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 1) return `/${parts.slice(0, -1).join("/")}`;
  return "/home";
}

export default function BackNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || pathname === "/" || pathname === "/landing" || pathname === "/home") {
    return null;
  }

  function handleBack() {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      router.back();
      return;
    }
    router.push(getFallbackPath(pathname));
  }

  return (
    <button
      type="button"
      className="abijob-back-navigation"
      onClick={handleBack}
      aria-label="Go back to the previous page"
      title="Go back"
    >
      <ArrowLeft size={18} strokeWidth={2.3} aria-hidden="true" />
      <span>Back</span>
    </button>
  );
}
