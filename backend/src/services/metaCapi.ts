import crypto from "crypto";

interface CapiEvent {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  value: number;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, "");
const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export function sendMetaEvent(event: CapiEvent): void {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;
  const userData: Record<string, string> = {};
  if (event.email) userData.em = hash(normalizeEmail(event.email));
  if (event.phone) userData.ph = hash(normalizePhone(event.phone));
  if (event.clientIp) userData.client_ip_address = event.clientIp;
  if (event.userAgent) userData.client_user_agent = event.userAgent;
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  const payload = {
    data: [{
      event_name: event.eventName,
      event_time: event.eventTime || Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      event_source_url: event.eventSourceUrl,
      action_source: "website",
      user_data: userData,
      custom_data: { currency: "EGP", value: event.value, contents: event.contents },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  void fetch(`https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) console.error("Meta CAPI request failed:", response.status);
  }).catch((error) => console.error("Meta CAPI request failed:", error instanceof Error ? error.message : "unknown error"))
    .finally(() => clearTimeout(timeout));
}
