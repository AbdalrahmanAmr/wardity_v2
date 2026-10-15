import { Router, Response } from "express";
import { db } from "../database/init.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { validate, createOrderSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { effectiveProductPrice } from "../utils/productPricing.js";
import { sendMetaEvent } from "../services/metaCapi.js";

export const ordersRouter = Router();
function cookie(req: AuthRequest, name: string): string | undefined {
  return req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

// All order routes require authentication
ordersRouter.use(authenticateToken);

/**
 * GET /api/orders
 * Get user's orders
 */
ordersRouter.get("/", (req: AuthRequest, res: Response) => {
  const orders = db
    .prepare(
      `
      SELECT 
        id,
        status,
        total,
        shipping_address as shippingAddress,
        payment_method as paymentMethod,
        created_at as createdAt,
        updated_at as updatedAt
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    )
    .all(req.userId!) as Array<{
    id: string;
    status: string;
    total: number;
    shippingAddress: string;
    paymentMethod: string | null;
    createdAt: string;
    updatedAt: string;
  }>;

  const ordersWithItems = orders.map((order) => {
    const items = db
      .prepare(
        `
        SELECT 
          oi.id,
          oi.quantity,
          oi.price,
          oi.selected_size as selectedSize,
          p.id as product_id,
          p.name,
          p.image,
          p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `
      )
      .all(order.id) as Array<{
      id: string;
      quantity: number;
      price: number;
      selectedSize: string | null;
      product_id: string;
      name: string;
      image: string;
      sku: string | null;
    }>;

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod || undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
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
  });

  res.json(ordersWithItems);
});

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
ordersRouter.get("/:id", (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = db
    .prepare(
      `
      SELECT 
        id,
        status,
        total,
        shipping_address as shippingAddress,
        payment_method as paymentMethod,
        created_at as createdAt,
        updated_at as updatedAt
      FROM orders
      WHERE id = ? AND user_id = ?
    `
    )
    .get(id, req.userId!) as
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

  if (!order) {
    res.status(404).json({
      message: "Order not found",
      status: 404,
    });
    return;
  }

  const items = db
    .prepare(
      `
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        oi.selected_size as selectedSize,
        p.id as product_id,
        p.name,
        p.image,
        p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `
    )
    .all(id) as Array<{
    id: string;
    quantity: number;
    price: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    image: string;
    sku: string | null;
  }>;

  res.json({
    id: order.id,
    status: order.status,
    total: order.total,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod || undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
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

/**
 * POST /api/orders
 * Create new order from cart
 */
ordersRouter.post("/", (req: AuthRequest, res: Response) => {
  const { shippingAddress, paymentMethod, eventId, consent, email, phone, sourceUrl } = validate(
    createOrderSchema,
    req.body
  );

  // Get cart items
  const cartItems = db
    .prepare(
      `
      SELECT 
        ci.product_id,
        ci.quantity,
        ci.selected_size,
        p.price,
        p.sale_price,
        p.is_on_sale,
        p.sale_ends_at,
        p.status,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `
    )
    .all(req.userId!) as Array<{
    product_id: string;
    quantity: number;
    selected_size: string | null;
    price: number;
    sale_price: number | null;
    is_on_sale: number;
    sale_ends_at: string | null;
    status: string;
    stock_quantity: number | null;
  }>;

  if (cartItems.length === 0) {
    res.status(400).json({
      message: "Cart is empty",
      status: 400,
    });
    return;
  }

  const orderId = generateId();
  let total = 0;
  const createOrder = db.transaction(() => {
    for (const item of cartItems) {
      if (item.status === "Out of stock" || (item.stock_quantity !== null && item.stock_quantity < item.quantity)) {
        throw new Error(`Product ${item.product_id} is out of stock or does not have enough stock available.`);
      }
    }
    const pricedItems = cartItems.map((item) => ({ ...item, effectivePrice: effectiveProductPrice(item) }));
    total = pricedItems.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0);
    db.prepare(
      "INSERT INTO orders (id, user_id, status, total, shipping_address, payment_method, event_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(orderId, req.userId!, "pending", total, shippingAddress, paymentMethod || null, eventId || null);
    for (const item of pricedItems) {
      db.prepare(
        "INSERT INTO order_items (id, order_id, product_id, quantity, price, selected_size) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(generateId(), orderId, item.product_id, item.quantity, item.effectivePrice, item.selected_size || null);
      if (item.stock_quantity !== null) {
        const remaining = item.stock_quantity - item.quantity;
        db.prepare("UPDATE products SET stock_quantity = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
          .run(remaining, remaining === 0 ? "Out of stock" : "In stock", item.product_id);
      }
    }
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.userId!);
  });
  try {
    createOrder();
  } catch (error) {
    res.status(409).json({ message: error instanceof Error ? error.message : "Unable to create order.", status: 409 });
    return;
  }

  // Return created order
  const order = db
    .prepare(
      `
      SELECT 
        id,
        status,
        total,
        shipping_address as shippingAddress,
        payment_method as paymentMethod,
        created_at as createdAt,
        updated_at as updatedAt
      FROM orders
      WHERE id = ?
    `
    )
    .get(orderId) as {
    id: string;
    status: string;
    total: number;
    shippingAddress: string;
    paymentMethod: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const items = db
    .prepare(
      `
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        oi.selected_size as selectedSize,
        p.id as product_id,
        p.name,
        p.image,
        p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `
    )
    .all(orderId) as Array<{
    id: string;
    quantity: number;
    price: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    image: string;
    sku: string | null;
  }>;

  res.status(201).json({
    id: order.id,
    status: order.status,
    total: order.total,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod || undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
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
  if (consent) {
    setImmediate(() => sendMetaEvent({
      eventName: "Purchase",
      eventId: eventId || orderId,
      value: order.total,
      contents: items.map((item) => ({ id: item.product_id, quantity: item.quantity, item_price: item.price })),
      email,
      phone,
      eventSourceUrl: sourceUrl,
      clientIp: req.ip,
      userAgent: req.get("user-agent"),
      fbp: cookie(req, "_fbp"),
      fbc: cookie(req, "_fbc"),
    }));
  }
});
