/**
 * Environment configuration
 * Validates and exports environment variables with type safety
 */

interface EnvConfig {
  apiUrl: string;
  adminPath: string;
  isDevelopment: boolean;
  isProduction: boolean;
  metaPixelId?: string;
  ga4Id?: string;
  facebookUrl: string;
}

function getEnvConfig(): EnvConfig {
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  const adminPath = (import.meta.env.VITE_ADMIN_PATH || "vdminnnboohgam")
    .replace(/^\/+|\/+$/g, "");
  const mode = import.meta.env.MODE;

  return {
    apiUrl,
    adminPath,
    isDevelopment: mode === "development",
    isProduction: mode === "production",
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID || undefined,
    ga4Id: import.meta.env.VITE_GA4_ID || undefined,
    facebookUrl:
      import.meta.env.VITE_FACEBOOK_URL ||
      "https://www.facebook.com/share/1Dk2Ft3DLL/",
  };
}

export const env = getEnvConfig();
