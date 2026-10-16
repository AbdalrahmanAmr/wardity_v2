import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const configPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../config/contact-settings.json");

export interface ContactSettings {
  values: { phone: string; email: string; whatsapp: string; telegram: string };
  enabled: { phone: boolean; email: boolean; whatsapp: boolean; telegram: boolean };
}

export const defaultContactSettings: ContactSettings = {
  values: { phone: "01115239553", email: "abdalrahmanamr275@gmail.com", whatsapp: "", telegram: "" },
  enabled: { phone: false, email: false, whatsapp: false, telegram: false },
};

export function readContactSettings(): ContactSettings {
  try {
    if (!existsSync(configPath)) return structuredClone(defaultContactSettings);
    const value = JSON.parse(readFileSync(configPath, "utf8")) as ContactSettings;
    return {
      values: { ...defaultContactSettings.values, ...value.values },
      enabled: { ...defaultContactSettings.enabled, ...value.enabled },
    };
  } catch {
    return structuredClone(defaultContactSettings);
  }
}

export function writeContactSettings(settings: ContactSettings): void {
  const temporaryPath = `${configPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryPath, configPath);
}

function validPhone(value: string): boolean { return /^\+?[\d\s().-]{7,20}$/.test(value.trim()); }
function validWhatsApp(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return validPhone(value) && /^[1-9]\d{7,14}$/.test(digits);
}
function validEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function validTelegram(value: string): boolean {
  if (/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value.trim())) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["t.me", "telegram.me"].includes(url.hostname.toLowerCase()) && /^\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/.test(url.pathname);
  } catch { return false; }
}

export function publicContactSettings(settings = readContactSettings()) {
  const { values, enabled } = settings;
  return {
    phone: enabled.phone && validPhone(values.phone) ? { value: values.phone } : null,
    email: enabled.email && validEmail(values.email) ? { value: values.email } : null,
    whatsapp: enabled.whatsapp && validWhatsApp(values.whatsapp) ? { digits: values.whatsapp.replace(/\D/g, "") } : null,
    telegram: enabled.telegram && validTelegram(values.telegram)
      ? { href: /^https?:\/\//i.test(values.telegram) ? values.telegram : `https://t.me/${values.telegram.trim().replace(/^@/, "")}` }
      : null,
  };
}

export function validateContactSettings(input: unknown): ContactSettings {
  if (!input || typeof input !== "object") throw new Error("Contact settings must be an object.");
  const settings = input as ContactSettings;
  const methods = ["phone", "email", "whatsapp", "telegram"] as const;
  if (!settings.values || !settings.enabled) throw new Error("Contact values and visibility switches are required.");
  for (const method of methods) {
    const value = settings.values[method];
    if (typeof value !== "string") throw new Error(`${method} must be text.`);
    if (typeof settings.enabled[method] !== "boolean") throw new Error(`${method} visibility must be on or off.`);
    if (!value.trim()) continue;
    if (method === "phone" && !validPhone(value)) throw new Error("Enter a valid phone number.");
    if (method === "email" && !validEmail(value)) throw new Error("Enter a valid email address.");
    if (method === "whatsapp" && !validWhatsApp(value)) throw new Error("Enter a WhatsApp number in international format with 8–15 digits; spaces, dashes, and a leading + are allowed.");
    if (method === "telegram" && !validTelegram(value)) throw new Error("Enter a Telegram username or a public t.me link.");
  }
  return { values: { ...settings.values }, enabled: { ...settings.enabled } };
}
