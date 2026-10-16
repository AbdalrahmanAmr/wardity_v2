import { FC } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLanguage } from "@/contexts/LanguageContext";

export const DarkModeToggle: FC = () => {
  const [isDark, , setTheme, theme] = useDarkMode();
  const { language } = useLanguage();

  return (
    <label className="flex min-h-11 items-center gap-1 rounded-lg px-1 text-gray-600 dark:text-gray-300" aria-label="Theme">
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      <select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")} className="min-h-11 max-w-24 rounded-md bg-transparent px-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={language === "ar" ? `المظهر، ${theme === "system" ? "تلقائي" : theme === "dark" ? "داكن" : "فاتح"}` : `Theme, ${theme}`}>
        <option value="system">{language === "ar" ? "تلقائي" : "System"}</option>
        <option value="light">{language === "ar" ? "فاتح" : "Light"}</option>
        <option value="dark">{language === "ar" ? "داكن" : "Dark"}</option>
      </select>
    </label>
  );
};
