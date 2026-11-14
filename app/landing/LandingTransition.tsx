"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";

export default function LandingTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.pathname !== "/") return;

    event.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => router.push(destination.pathname + destination.search + destination.hash),
      reducedMotion ? 40 : 760,
    );
  }

  return (
    <div className="landing-transition-root" onClick={handleClick}>
      {children}
      <div className={`landing-transition-curtain${isLeaving ? " is-active" : ""}`} aria-hidden="true">
        <span className="landing-transition-curtain__panel" />
        <span className="landing-transition-curtain__edge" />
        <span className="landing-transition-curtain__glint" />
      </div>
    </div>
  );
}
