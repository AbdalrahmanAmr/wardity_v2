import { useTheme, type Theme } from "@/contexts/ThemeContext";
export type { Theme } from "@/contexts/ThemeContext";

/**
 * Custom hook to manage dark mode state
 * Persists theme preference in localStorage and applies it to the document
 * @returns Tuple of [isDark, toggleTheme, setTheme]
 */
export function useDarkMode(): [boolean, () => void, (theme: Theme) => void, Theme] {
  const { isDark, theme, toggleTheme, setTheme } = useTheme();
  return [isDark, toggleTheme, setTheme, theme];
}
