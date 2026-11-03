"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

export default function ThemeSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  const options: {
    value: ThemePreference;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "light", label: "Light", icon: <Sun size={16} /> },
    { value: "dark", label: "Dark", icon: <Moon size={16} /> },
    { value: "system", label: "System", icon: <Monitor size={16} /> },
  ];

  return (
    <div className={`abi-theme-switcher ${compact ? "abi-theme-switcher-compact" : ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "active" : ""}
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          title={`${option.label} mode`}
        >
          {option.icon}
          {!compact && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}