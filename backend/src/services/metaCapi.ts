import crypto from "crypto";
import { runtimeConfig } from "../config/runtime.js";
import { dbRun } from "../database/mysql.js";

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

export function sendMetaEvent(event: CapiEvent, orderId?: string): void {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) {
    if (orderId) {
      void dbRun(
        "UPDATE orders SET capi_status = 'skipped', capi_error = ?, updated_at = NOW() WHERE id = ?",
        ["Meta CAPI is not configured", orderId],
      ).catch((error) => console.error("Could not persist Meta CAPI status:", error));
    }
    return;
  }
  if (orderId) {
    void dbRun(
      "UPDATE orders SET capi_status = 'pending', capi_error = NULL, updated_at = NOW() WHERE id = ?",
      [orderId],
    ).catch((error) => console.error("Could not persist Meta CAPI status:", error));
  }
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
  const timeout = setTimeout(() => controller.abort(), runtimeConfig.metaCapiTimeoutMs);
  void fetch(`${runtimeConfig.metaGraphBaseUrl}/${process.env.META_GRAPH_VERSION || "v26.0"}/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      const error = `Meta CAPI request failed (${response.status})`;
      console.error(error);
      if (orderId) await dbRun(
        "UPDATE orders SET capi_status = 'failed', capi_error = ?, updated_at = NOW() WHERE id = ?",
        [error, orderId],
      );
      return;
    }
    if (orderId) await dbRun(
      "UPDATE orders SET capi_status = 'sent', capi_error = NULL, updated_at = NOW() WHERE id = ?",
      [orderId],
    );
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : "Meta CAPI request failed";
    console.error("Meta CAPI request failed:", message);
    if (orderId) await dbRun(
      "UPDATE orders SET capi_status = 'failed', capi_error = ?, updated_at = NOW() WHERE id = ?",
      [message, orderId],
    );
  })
    .finally(() => clearTimeout(timeout));
}

export function logMetaConfigurationStatus(): void {
  if (!process.env.META_PIXEL_ID || !process.env.META_CAPI_TOKEN) {
    console.warn("Meta CAPI is disabled: META_PIXEL_ID and META_CAPI_TOKEN are required.");
  }
}
