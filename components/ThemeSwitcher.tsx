"use client";

import { Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { setTheme } = useTheme();

  return (
    <div
      className={`abi-theme-switcher ${
        compact ? "abi-theme-switcher-compact" : ""
      }`}
    >
      <button
        type="button"
        className="active"
        onClick={() => setTheme("light")}
        aria-pressed="true"
        title="Light mode"
      >
        <Sun size={16} />
        {!compact && <span>Light</span>}
      </button>
    </div>
  );
}