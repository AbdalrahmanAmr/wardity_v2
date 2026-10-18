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
  total?: number | null;
  items: OrderNotificationItem[];
}

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const buildOrderText = (payload: OrderNotificationPayload) => {
  const lines = [
    "Wardity order notification",
    `Order ID: ${payload.orderId}`,
    `Customer: ${payload.customerName || "Unknown"}`,
    `Phone: ${payload.customerPhone || "Not provided"}`,
    `Location: ${payload.deliveryLocationName || payload.shippingAddress || "Not provided"}`,
    `Delivery date: ${payload.requestedDeliveryDate || "Not set"}`,
    `Delivery time: ${payload.requestedDeliveryTime || "Today / ASAP"}`,
    `Total: ${payload.total != null ? formatMoney(payload.total) : "Quote pending"}`,
    "Items:",
  ];

  payload.items.forEach((item) => {
    const sku = item.sku ? `SKU: ${item.sku}` : "SKU: not provided";
    const image = item.image ? `Image: ${item.image}` : "Image: not provided";
    lines.push(
      `- ${item.name} (${sku}) x${item.quantity} — ${formatMoney(item.price)} — ${image}`,
    );
  });

  return lines.join("\n");
};

const sendJson = async (
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtimeConfig.orderNotificationTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Notification request failed (${response.status}): ${text || url}`,
      );
    }
  } catch (error) {
    console.error(
      "Notification request failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  } finally {
    clearTimeout(timeout);
  }
};

export async function sendOrderNotifications(
  payload: OrderNotificationPayload,
) {
  const text = buildOrderText(payload);

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (telegramToken && telegramChatId) {
    await sendJson(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      chat_id: telegramChatId,
      text,
      disable_web_page_preview: true,
    });
  }

  const whatsappToken = process.env.WHATSAPP_TOKEN?.trim();
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const recipients = (process.env.WHATSAPP_ORDER_RECIPIENTS || "")
    .split(",")
    .map((recipient) => normalizeDigits(recipient))
    .filter(Boolean);

  if (whatsappToken && whatsappPhoneNumberId && recipients.length > 0) {
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    await Promise.all(
      recipients.map((recipient) =>
        sendJson(
          `https://graph.facebook.com/${apiVersion}/${whatsappPhoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: recipient,
            type: "text",
            text: { body: text },
          },
          { Authorization: `Bearer ${whatsappToken}` },
        ),
      ),
    );
  }
}
