import en from "./storefront.en";
import ar from "./storefront.ar";

export const translations = { en, ar } as const;
export type TranslationKey = keyof typeof en;
