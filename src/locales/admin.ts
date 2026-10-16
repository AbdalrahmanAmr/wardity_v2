import { useLanguage } from "@/contexts/LanguageContext";
import { adminAr } from "./admin.ar";
import { adminEn } from "./admin.en";

export type AdminTranslationKey = keyof typeof adminEn;
export function useAdminTranslations() {
  const { language } = useLanguage();
  return language === "ar" ? adminAr : adminEn;
}
