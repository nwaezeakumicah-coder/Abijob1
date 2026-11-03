"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "abijob-theme";

function applyTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const resolvedTheme =
    theme === "system"
      ? prefersDark
        ? "dark"
        : "light"
      : theme;

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  // Load the saved preference once.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (
        stored === "light" ||
        stored === "dark" ||
        stored === "system"
      ) {
        setThemeState(stored);
      }
    } catch {
      // Use system preference if localStorage is unavailable.
    }
  }, []);

  // Apply the selected theme and listen for system changes.
  useEffect(() => {
    applyTheme(theme);

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [theme]);

  function setTheme(nextTheme: ThemePreference) {
    setThemeState(nextTheme);

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme still works for the current session.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}