import { dbAll, dbRun } from "../database/mysql.js";
import { runtimeConfig } from "../config/runtime.js";

interface OrderNotificationItem {
  name: string;
  sku?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface OrderNotificationPayload {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  deliveryLocationName?: string;
  requestedDeliveryDate?: string | null;
  requestedDeliveryTime?: string | null;
  orderCreatedAt?: string | null;
  total?: number | null;
  paymentMethod?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  items: OrderNotificationItem[];
}

type WhatsAppStatus = "pending" | "sent" | "failed";

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const formatMoney = (value: number) =>
  `${Number(value).toFixed(2)} جنيه`;

const sanitizeParameter = (value: unknown, maxLength = 1000) => {
  const sanitized = String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim()
    .slice(0, maxLength)
    .trim();
  return sanitized || "لا يوجد";
};

const formatOrderTime = (value?: string | null) => {
  if (!value) return "لا يوجد";
  const date = new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value.replace(" ", "T")}Z`,
  );
  if (Number.isNaN(date.getTime())) return sanitizeParameter(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod") === "PM" ? "م" : "ص"}`;
};

const paymentMethodInArabic = (value?: string | null) => {
  const methods: Record<string, string> = {
    cash_on_delivery: "الدفع عند الاستلام",
    card: "الدفع بالبطاقة",
    credit_card: "الدفع بالبطاقة",
    bank_transfer: "تحويل بنكي",
    wallet: "الدفع بالمحفظة الإلكترونية",
  };
  return methods[value || ""] || value || "لا يوجد";
};

const mapsLink = (payload: OrderNotificationPayload) => {
  if (
    Number.isFinite(payload.latitude) &&
    Number.isFinite(payload.longitude)
  ) {
    return `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`;
  }
  const address = [payload.shippingAddress, payload.deliveryLocationName]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "delivery address")}`;
};

const buildItemsSummary = (payload: OrderNotificationPayload) =>
  payload.items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(" | ");

const sendJson = async (
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ ok: boolean; error?: string }> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    runtimeConfig.orderNotificationTimeoutMs,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      await response.text();
      return { ok: false, error: `Notification request failed (${response.status})` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Notification request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
};

async function updateWhatsAppStatus(
  orderId: string,
  status: WhatsAppStatus,
  error?: string,
) {
  await dbRun(
    "UPDATE orders SET whatsapp_status = ?, whatsapp_error = ?, updated_at = NOW() WHERE id = ?",
    [status, error || null, orderId],
  );
}

async function sendWithRetry(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  onAttempt?: (result: { ok: boolean; error?: string }) => Promise<void>,
) {
  let result = await sendJson(url, body, headers);
  await onAttempt?.(result);
  if (!result.ok) {
    result = await sendJson(url, body, headers);
    await onAttempt?.(result);
  }
  return result;
}

async function sendWhatsAppNotification(
  payload: OrderNotificationPayload,
): Promise<WhatsAppStatus> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG?.trim();
  const recipients = (process.env.WHATSAPP_ORDER_RECIPIENTS || "")
    .split(",")
    .map((recipient) => normalizeDigits(recipient))
    .filter(Boolean);

  if (!token || !phoneNumberId || !templateName || !templateLanguage || recipients.length === 0) {
    const error = "WhatsApp notification is not configured";
    await updateWhatsAppStatus(payload.orderId, "failed", error);
    console.error(error);
    return "failed";
  }

  await updateWhatsAppStatus(payload.orderId, "pending");
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v26.0";
  const url = `${runtimeConfig.whatsappApiBaseUrl}/${apiVersion}/${phoneNumberId}/messages`;
  const headers = { Authorization: `Bearer ${token}` };
  const bodyParameters = [
    sanitizeParameter(payload.orderId),
    sanitizeParameter(formatOrderTime(payload.orderCreatedAt)),
    sanitizeParameter(payload.customerName),
    sanitizeParameter(payload.customerPhone),
    sanitizeParameter(buildItemsSummary(payload)),
    sanitizeParameter(payload.total != null ? formatMoney(payload.total) : null),
    sanitizeParameter(paymentMethodInArabic(payload.paymentMethod)),
    sanitizeParameter(payload.shippingAddress),
    sanitizeParameter(mapsLink(payload)),
    sanitizeParameter(
      [payload.requestedDeliveryDate, payload.requestedDeliveryTime]
        .filter(Boolean)
        .join(" / "),
    ),
    sanitizeParameter(payload.notes, 300),
  ].map((text) => ({ type: "text", text }));

  let failed = false;
  for (const recipient of recipients) {
    const result = await sendWithRetry(
      url,
      {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            ...(payload.items[0]?.image && /^https?:\/\//i.test(payload.items[0].image)
              ? [{ type: "header", parameters: [{ type: "image", image: { link: payload.items[0].image } }] }]
              : []),
            { type: "body", parameters: bodyParameters },
          ],
        },
      },
      headers,
      (result) =>
        updateWhatsAppStatus(
          payload.orderId,
          result.ok ? "pending" : "failed",
          result.ok ? undefined : result.error,
        ),
    );
    if (!result.ok) {
      failed = true;
      console.error(`WhatsApp notification failed for order ${payload.orderId}: ${result.error}`);
      continue;
    }

    for (const item of payload.items.slice(1, 4)) {
      if (!item.image || !/^https?:\/\//i.test(item.image)) continue;
      const imageResult = await sendWithRetry(
        url,
        {
          messaging_product: "whatsapp",
          to: recipient,
          type: "image",
          image: { link: item.image },
        },
        headers,
        (result) =>
          updateWhatsAppStatus(
            payload.orderId,
            result.ok ? "pending" : "failed",
            result.ok ? undefined : result.error,
          ),
      );
      if (!imageResult.ok) {
        console.error(`WhatsApp product image failed for order ${payload.orderId}: ${imageResult.error}`);
      }
    }
  }

  const status: WhatsAppStatus = failed ? "failed" : "sent";
  await updateWhatsAppStatus(payload.orderId, status, failed ? "One or more WhatsApp recipients failed" : undefined);
  return status;
}

export async function sendOrderNotifications(
  payload: OrderNotificationPayload,
  options: { whatsappOnly?: boolean } = {},
): Promise<WhatsAppStatus | undefined> {
  try {
    if (!options.whatsappOnly) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();
      if (telegramToken && telegramChatId) {
        const text = `Wardity order ${payload.orderId}: ${buildItemsSummary(payload)}`;
        const result = await sendJson(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          { chat_id: telegramChatId, text, disable_web_page_preview: true },
        );
        if (!result.ok) console.error(`Telegram notification failed for order ${payload.orderId}: ${result.error}`);
      }
    }
    return sendWhatsAppNotification(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected notification failure";
    console.error(`Order notification failed for ${payload.orderId}: ${message}`);
    try {
      await updateWhatsAppStatus(payload.orderId, "failed", message);
    } catch (statusError) {
      console.error(`Could not persist WhatsApp failure for order ${payload.orderId}: ${statusError instanceof Error ? statusError.message : "unknown error"}`);
    }
    return "failed";
  }
}

export async function loadOrderNotificationPayload(
  orderId: string,
): Promise<OrderNotificationPayload | undefined> {
  const order = await dbAll<{
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    shippingAddress: string;
    deliveryLocationName: string | null;
    requestedDeliveryDate: string | null;
    requestedDeliveryTime: string | null;
    orderCreatedAt: string;
    total: number | null;
    paymentMethod: string | null;
    notes: string | null;
  }>(
    `SELECT o.id, u.name AS customerName, u.phone AS customerPhone,
            o.shipping_address AS shippingAddress,
            o.delivery_location_name AS deliveryLocationName,
            o.requested_delivery_date AS requestedDeliveryDate,
            o.requested_delivery_time AS requestedDeliveryTime,
            o.created_at AS orderCreatedAt,
            o.total, o.payment_method AS paymentMethod, o.notes
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
    [orderId],
  );
  if (!order[0]) return undefined;
  const items = await dbAll<OrderNotificationItem>(
    `SELECT p.name, p.sku, oi.price, oi.quantity, p.image
       FROM order_items oi JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ? ORDER BY oi.id`,
    [orderId],
  );
  return {
    orderId: order[0].id,
    customerName: order[0].customerName || undefined,
    customerPhone: order[0].customerPhone || undefined,
    shippingAddress: order[0].shippingAddress,
    deliveryLocationName: order[0].deliveryLocationName || undefined,
    requestedDeliveryDate: order[0].requestedDeliveryDate,
    requestedDeliveryTime: order[0].requestedDeliveryTime,
    orderCreatedAt: order[0].orderCreatedAt,
    total: order[0].total,
    paymentMethod: order[0].paymentMethod,
    notes: order[0].notes,
    items,
  };
}
