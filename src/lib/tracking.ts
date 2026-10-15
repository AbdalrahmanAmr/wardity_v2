import { env } from "@/config";
import { api } from "@/services/api";

export type TrackingConsent = "accepted" | "rejected" | "custom";
export interface TrackingProduct {
  id: string;
  name?: string;
  price: number;
  quantity?: number;
  selectedSize?: string;
}

interface EventOptions {
  eventId?: string;
  consent?: boolean;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let enabled = false;
let loaded = false;

export function setTrackingEnabled(value: boolean): void {
  enabled = value;
}

export function loadTrackingScripts(): void {
  if (!enabled || loaded || (!env.metaPixelId && !env.ga4Id) || window.location.pathname.startsWith("/admin")) return;
  loaded = true;
  if (env.metaPixelId) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq = window.fbq || ((...args: unknown[]) => ((window.fbq as unknown as { q?: unknown[] }).q ||= []).push(args));
    window.fbq("init", env.metaPixelId);
  }
  if (env.ga4Id) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(env.ga4Id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag("js", new Date());
    window.gtag("config", env.ga4Id);
  }
}

function safeEventId(): string {
  return crypto.randomUUID();
}

function send(name: string, params: Record<string, unknown>, options: EventOptions = {}): void {
  try {
    if (!enabled || window.location.pathname.startsWith("/admin")) return;
    const eventId = options.eventId || safeEventId();
    if (window.fbq && env.metaPixelId) window.fbq("track", name, params, { eventID: eventId });
    if (window.gtag && env.ga4Id) window.gtag("event", name, params);
    if (options.consent && (name === "AddToCart" || name === "InitiateCheckout")) {
      void api.post("/track", { event: name, eventId, ...params, consent: true }).catch(() => undefined);
    }
  } catch {
    // Tracking must never affect the shopping experience.
  }
}

export function trackPageView(path: string): void { send("PageView", { page_path: path }); }
export function trackViewContent(product: TrackingProduct): void {
  send("ViewContent", { content_ids: [product.id], content_id: product.id, content_name: product.name, content_type: "product", value: product.price, currency: "EGP" });
}
export function trackSearch(searchString: string): void { send("Search", { search_string: searchString }); }
export function trackAddToCart(product: TrackingProduct): void {
  send("AddToCart", { content_ids: [product.id], content_id: product.id, content_type: "product", value: product.price * (product.quantity || 1), currency: "EGP", quantity: product.quantity || 1, selected_size: product.selectedSize }, { eventId: safeEventId(), consent: true });
}
export function trackAddToWishlist(product: TrackingProduct): void {
  send("AddToWishlist", { content_ids: [product.id], content_id: product.id, content_type: "product", value: product.price, currency: "EGP" });
}
export function trackInitiateCheckout(value: number, contents: TrackingProduct[]): string {
  const eventId = safeEventId();
  send("InitiateCheckout", { content_ids: contents.map((item) => item.id), content_type: "product", value, currency: "EGP", num_items: contents.reduce((sum, item) => sum + (item.quantity || 1), 0) }, { eventId, consent: true });
  return eventId;
}
export function trackPurchase(orderId: string, value: number, contents: TrackingProduct[], eventId = safeEventId()): void {
  const key = `wardity-tracked-purchase:${orderId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, eventId);
  send("Purchase", { content_ids: contents.map((item) => item.id), content_type: "product", value, currency: "EGP", order_id: orderId }, { eventId });
}
