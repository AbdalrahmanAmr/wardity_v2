export interface ContactSettings {
  values: { phone: string; email: string; whatsapp: string; telegram: string };
  enabled: { phone: boolean; email: boolean; whatsapp: boolean; telegram: boolean };
}

export interface PublicContactSettings {
  phone: { value: string } | null;
  email: { value: string } | null;
  whatsapp: { digits: string } | null;
  telegram: { href: string } | null;
}
