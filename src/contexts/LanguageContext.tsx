import { createContext, useContext, useCallback, useEffect, useState, type FC, type ReactNode } from "react";
import { translations, type TranslationKey } from "@/locales/storefront";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem("wardity-language");
      const value = stored ? JSON.parse(stored) : null;
      return value === "ar" ? "ar" : "en";
    } catch { return "en"; }
  });

  const setLanguage = useCallback(
    (lang: Language) => {
      const validLanguage: Language = lang === "ar" ? "ar" : "en";
      localStorage.setItem("wardity-language", JSON.stringify(validLanguage));
      setLanguageState(validLanguage);
    },
    [setLanguageState]
  );

  const toggleLanguage = useCallback(() => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    const fontId = "wardity-arabic-font";
    if (language === "ar" && !document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    } else if (language === "en") document.getElementById(fontId)?.remove();
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    isRTL: language === "ar",
    t: (key, values) => {
      let result = translations[language][key] ?? translations.en[key] ?? key;
      if (language === "ar" && !translations.ar[key] && import.meta.env.DEV) console.warn(`[i18n] Missing Arabic translation: ${key}`);
      for (const [name, replacement] of Object.entries(values ?? {})) result = result.replaceAll(`{${name}}`, String(replacement));
      return result;
    },
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
