/**
 * Environment configuration
 * Validates and exports environment variables with type safety
 */

interface EnvConfig {
  apiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  metaPixelId?: string;
  ga4Id?: string;
}

function getEnvConfig(): EnvConfig {
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  const mode = import.meta.env.MODE;

  return {
    apiUrl,
    isDevelopment: mode === "development",
    isProduction: mode === "production",
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID || undefined,
    ga4Id: import.meta.env.VITE_GA4_ID || undefined,
  };
}

export const env = getEnvConfig();
