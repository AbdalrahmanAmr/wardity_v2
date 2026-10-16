import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type ThemeContextValue = { isDark: boolean; theme: Theme; toggleTheme: () => void; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const KEY = "wardity-theme";

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    let parsed: unknown = "system";
    if (value) {
      try { parsed = JSON.parse(value); } catch { parsed = value; }
    }
    return parsed === "light" || parsed === "dark" || parsed === "system" ? parsed : "system";
  } catch { return "system"; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  const setTheme = useCallback((next: Theme) => {
    const valid: Theme = next === "light" || next === "dark" || next === "system" ? next : "system";
    try { localStorage.setItem(KEY, JSON.stringify(valid)); } catch { /* Theme still works for this session if storage is unavailable. */ }
    setThemeState(valid);
  }, []);
  const toggleTheme = useCallback(() => setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system"), [setTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#241d20" : "#D02046");
  }, [isDark]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    const syncSavedTheme = (event: StorageEvent) => { if (event.key === KEY) setThemeState(readTheme()); };
    window.addEventListener("storage", syncSavedTheme);
    return () => { media.removeEventListener("change", update); window.removeEventListener("storage", syncSavedTheme); };
  }, []);

  return <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
