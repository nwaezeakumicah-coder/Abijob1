"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  theme: "light";
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyLightTheme() {
  document.documentElement.dataset.theme = "light";
  document.documentElement.style.colorScheme = "light";
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    applyLightTheme();
  }, []);

  function setTheme(_theme: ThemePreference) {
    applyLightTheme();
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme,
      }}
    >
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