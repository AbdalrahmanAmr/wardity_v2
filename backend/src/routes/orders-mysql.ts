/**
 * MySQL-compatible version of routes/orders.ts
 *
 * Key changes from SQLite version:
 *  - All handlers are async
 *  - db.prepare().get/all/run() → await dbGet/dbAll/dbRun()
 *  - db.transaction(fn)() → await dbTransaction(async conn => …)
 *  - datetime('now') → NOW()
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { validate, createOrderSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { effectiveProductPrice } from "../utils/productPricing.js";
import { sendMetaEvent } from "../services/metaCapi.js";
import { sendOrderNotifications } from "../services/orderNotifications.js";
import { dbGet, dbAll, dbTransaction } from "../database/mysql.js";

export const ordersRouterMySQL = Router();

const CAIRO_TIME_ZONE = "Africa/Cairo";

function cairoToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts();
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function validateDeliverySchedule(
  date: string,
  time: string | null | undefined,
): { time: string | null } {
  if (date < cairoToday())
    throw Object.assign(new Error("Delivery date cannot be in the past."), {
      code: 400,
    });
  if (date === cairoToday()) return { time: null };
  if (!time)
    throw Object.assign(
      new Error("Select a delivery time for a future date."),
      { code: 400 },
    );

  const match = /^(\d{2}):(\d{2})$/.exec(time);
  const minutes = match ? Number(match[1]) * 60 + Number(match[2]) : -1;
  const validMinutes = [
    ...Array.from({ length: 14 }, (_, index) => 10 * 60 + index * 30),
    0,
    30,
    60,
  ];

  if (!match || !validMinutes.includes(minutes)) {
    throw Object.assign(
      new Error(
        "Delivery time must be between 10:00 AM and 1:00 AM in 30-minute intervals.",
      ),
      { code: 400 },
    );
  }

  return { time };
}

function cookie(req: AuthRequest, name: string): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

ordersRouterMySQL.use(authenticateToken);

// ── GET /api/orders ────────────────────────────────────────────────────────
ordersRouterMySQL.get("/", async (req: AuthRequest, res: Response) => {
  const orders = await dbAll<{
    id: string;
    status: string;
    total: number;
    shippingAddress: string;
    paymentMethod: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    `SELECT id, status, total, merchandise_subtotal AS merchandiseSubtotal, delivery_location_id AS deliveryLocationId, delivery_location_name AS deliveryLocationName, delivery_location_name_ar AS deliveryLocationNameAr, delivery_fee AS deliveryFee, requested_delivery_date AS requestedDeliveryDate, requested_delivery_time AS requestedDeliveryTime, requires_shipping_quote AS requiresShippingQuote,
            shipping_address AS shippingAddress,
            payment_method   AS paymentMethod,
            created_at       AS createdAt,
            updated_at       AS updatedAt
       FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    [req.userId!],
  );

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await dbAll<{
        id: string;
        quantity: number;
        price: number;
        selectedSize: string | null;
        product_id: string;
        name: string;
        image: string;
        sku: string | null;
      }>(
        `SELECT oi.id, oi.quantity, oi.price,
                oi.selected_size AS selectedSize,
                p.id AS product_id, p.name, p.image, p.sku
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?`,
        [order.id],
      );
      return {
        ...order,
        items: items.map((item) => ({
          id: item.id,
          product: {
            id: item.product_id,
            name: item.name,
            image: item.image,
            sku: item.sku,
          },
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize || undefined,
        })),
      };
    }),
  );

  res.json(ordersWithItems);
});

// ── GET /api/orders/:id ────────────────────────────────────────────────────
ordersRouterMySQL.get("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await dbGet<{
    id: string;
    status: string;
    total: number;
    shippingAddress: string;
    paymentMethod: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    `SELECT id, status, total, merchandise_subtotal AS merchandiseSubtotal, delivery_location_id AS deliveryLocationId, delivery_location_name AS deliveryLocationName, delivery_location_name_ar AS deliveryLocationNameAr, delivery_fee AS deliveryFee, requested_delivery_date AS requestedDeliveryDate, requested_delivery_time AS requestedDeliveryTime, requires_shipping_quote AS requiresShippingQuote,
            shipping_address AS shippingAddress,
            payment_method   AS paymentMethod,
            created_at       AS createdAt,
            updated_at       AS updatedAt
       FROM orders
      WHERE id = ? AND user_id = ?`,
    [id, req.userId!],
  );

  if (!order) {
    res.status(404).json({ message: "Order not found", status: 404 });
    return;
  }

  const items = await dbAll<{
    id: string;
    quantity: number;
    price: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    image: string;
    sku: string | null;
  }>(
    `SELECT oi.id, oi.quantity, oi.price,
            oi.selected_size AS selectedSize,
            p.id AS product_id, p.name, p.image, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
    [id],
  );

  res.json({
    ...order,
    paymentMethod: order.paymentMethod || undefined,
    items: items.map((item) => ({
      id: item.id,
      product: {
        id: item.product_id,
        name: item.name,
        image: item.image,
        sku: item.sku,
      },
      quantity: item.quantity,
      price: item.price,
      selectedSize: item.selectedSize || undefined,
    })),
  });
});

// ── POST /api/orders ───────────────────────────────────────────────────────
ordersRouterMySQL.post("/", async (req: AuthRequest, res: Response) => {
  const {
    shippingAddress,
    customerName,
    paymentMethod,
    eventId,
    consent,
    email,
    phone,
    sourceUrl,
    deliveryLocationId,
    requestedDeliveryDate,
    requestedDeliveryTime,
  } = validate(createOrderSchema, req.body);

  const cartItems = await dbAll<{
    product_id: string;
    quantity: number;
    selected_size: string | null;
    price: number;
    sale_price: number | null;
    is_on_sale: number;
    sale_ends_at: string | null;
    status: string;
    stock_quantity: number | null;
  }>(
    `SELECT ci.product_id, ci.quantity, ci.selected_size,
            p.price, p.sale_price, p.is_on_sale, p.sale_ends_at,
            p.status, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?`,
    [req.userId!],
  );

  if (cartItems.length === 0) {
    res.status(400).json({ message: "Cart is empty", status: 400 });
    return;
  }

  const location = await dbGet<{
    id: string;
    name: string;
    name_ar: string;
    delivery_fee: number | null;
    requires_quote: number;
    is_active: number;
  }>(
    "SELECT id, name, name_ar, delivery_fee, requires_quote, is_active FROM delivery_locations WHERE id = ?",
    [deliveryLocationId],
  );
  if (!location || !location.is_active) {
    res
      .status(400)
      .json({
        message: "The selected delivery location is unavailable.",
        status: 400,
      });
    return;
  }
  const schedule = validateDeliverySchedule(
    requestedDeliveryDate,
    requestedDeliveryTime,
  );
  const requiresQuote = Boolean(location.requires_quote);

  const orderId = generateId();
  let total: number | null = null;
  let createdOrder:
    | {
        id: string;
        status: string;
        total: number;
        shippingAddress: string;
        paymentMethod: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | undefined;
  let orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    image: string;
    sku: string | null;
  }> = [];

  try {
    await dbTransaction(async (conn) => {
      // Stock validation
      for (const item of cartItems) {
        if (
          item.status === "Out of stock" ||
          (item.stock_quantity !== null && item.stock_quantity < item.quantity)
        ) {
          throw new Error(
            `Product ${item.product_id} is out of stock or does not have enough stock available.`,
          );
        }
      }

      const pricedItems = cartItems.map((item) => ({
        ...item,
        effectivePrice: effectiveProductPrice(item),
      }));
      const merchandiseSubtotal = pricedItems.reduce(
        (sum, item) => sum + item.effectivePrice * item.quantity,
        0,
      );
      if (
        !requiresQuote &&
        merchandiseSubtotal <= 2000 &&
        location.delivery_fee === null
      ) {
        throw Object.assign(
          new Error(
            "Delivery pricing is not configured for this location yet.",
          ),
          { code: 400 },
        );
      }
      const deliveryFee = requiresQuote
        ? null
        : merchandiseSubtotal > 2000
          ? 0
          : Number(location.delivery_fee);
      total = requiresQuote ? null : merchandiseSubtotal + deliveryFee!;

      await conn.execute(
        "INSERT INTO orders (id, user_id, status, total, merchandise_subtotal, delivery_location_id, delivery_location_name, delivery_location_name_ar, delivery_fee, requested_delivery_date, requested_delivery_time, requires_shipping_quote, shipping_address, payment_method, event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          orderId,
          req.userId!,
          requiresQuote ? "awaiting_shipping_quote" : "pending",
          total,
          merchandiseSubtotal,
          location.id,
          location.name,
          location.name_ar,
          deliveryFee,
          requestedDeliveryDate,
          schedule.time,
          requiresQuote ? 1 : 0,
          shippingAddress,
          paymentMethod || null,
          eventId || null,
        ],
      );

      for (const item of pricedItems) {
        await conn.execute(
          "INSERT INTO order_items (id, order_id, product_id, quantity, price, selected_size) VALUES (?, ?, ?, ?, ?, ?)",
          [
            generateId(),
            orderId,
            item.product_id,
            item.quantity,
            item.effectivePrice,
            item.selected_size || null,
          ],
        );
        if (item.stock_quantity !== null) {
          const remaining = item.stock_quantity - item.quantity;
          await conn.execute(
            "UPDATE products SET stock_quantity = ?, status = ?, updated_at = NOW() WHERE id = ?",
            [
              remaining,
              remaining === 0 ? "Out of stock" : "In stock",
              item.product_id,
            ],
          );
        }
      }

      await conn.execute("DELETE FROM cart_items WHERE user_id = ?", [
        req.userId!,
      ]);
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: number }).code === 400
        ? 400
        : 409;
    res
      .status(status)
      .json({
        message:
          error instanceof Error ? error.message : "Unable to create order.",
        status,
      });
    return;
  }

  createdOrder = await dbGet<{
    id: string;
    status: string;
    total: number;
    shippingAddress: string;
    paymentMethod: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    `SELECT id, status, total, merchandise_subtotal AS merchandiseSubtotal, delivery_location_id AS deliveryLocationId, delivery_location_name AS deliveryLocationName, delivery_location_name_ar AS deliveryLocationNameAr, delivery_fee AS deliveryFee, requested_delivery_date AS requestedDeliveryDate, requested_delivery_time AS requestedDeliveryTime, requires_shipping_quote AS requiresShippingQuote,
            shipping_address AS shippingAddress,
            payment_method   AS paymentMethod,
            created_at       AS createdAt,
            updated_at       AS updatedAt
       FROM orders WHERE id = ?`,
    [orderId],
  );

  orderItems = await dbAll<{
    id: string;
    quantity: number;
    price: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    image: string;
    sku: string | null;
  }>(
    `SELECT oi.id, oi.quantity, oi.price,
            oi.selected_size AS selectedSize,
            p.id AS product_id, p.name, p.image, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
    [orderId],
  );

  res.status(201).json({
    ...createdOrder,
    paymentMethod: createdOrder?.paymentMethod || undefined,
    items: orderItems.map((item) => ({
      id: item.id,
      product: {
        id: item.product_id,
        name: item.name,
        image: item.image,
        sku: item.sku,
      },
      quantity: item.quantity,
      price: item.price,
      selectedSize: item.selectedSize || undefined,
    })),
  });

  void sendOrderNotifications({
    orderId,
    customerName: customerName || undefined,
    customerPhone: phone || undefined,
    shippingAddress,
    deliveryLocationName: location.name,
    requestedDeliveryDate,
    requestedDeliveryTime: schedule.time,
    total: createdOrder?.total ?? null,
    items: orderItems.map((item) => ({
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
  });

  if (consent && createdOrder!.total !== null) {
    setImmediate(() =>
      sendMetaEvent({
        eventName: "Purchase",
        eventId: eventId || orderId,
        value: createdOrder!.total,
        contents: orderItems.map((item) => ({
          id: item.product_id,
          quantity: item.quantity,
          item_price: item.price,
        })),
        email,
        phone,
        eventSourceUrl: sourceUrl,
        clientIp: req.ip,
        userAgent: req.get("user-agent"),
        fbp: cookie(req, "_fbp"),
        fbc: cookie(req, "_fbc"),
      }),
    );
  }
});
