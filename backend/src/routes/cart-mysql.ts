/**
 * MySQL-compatible version of routes/cart.ts
 *
 * Key changes:
 *  - All handlers async
 *  - datetime('now') → NOW()
 *  - SQLite NULL comparison: "selected_size IS NULL AND ? IS NULL"
 *    → MySQL equivalent: same syntax works in MySQL
 */

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { validate, addToCartSchema, updateCartItemSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { effectiveStatus, getEffectiveSale, ProductSaleFields } from "../utils/productPricing.js";
import { dbGet, dbAll, dbRun } from "../database/mysql.js";

export const cartRouterMySQL = Router();

type CartProductRow = ProductSaleFields & {
  id: string;
  quantity: number;
  selectedSize: string | null;
  product_id: string;
  name: string;
  badge: string | null;
  image: string;
  imageDesc: string | null;
  brandLogo: string | null;
  sku: string | null;
};

function formatCartProduct(item: CartProductRow) {
  const sale = getEffectiveSale(item);
  return {
    id:              item.product_id,
    name:            item.name,
    price:           item.price,
    salePrice:       sale.salePrice,
    isOnSale:        sale.isOnSale,
    discountPercent: sale.discountPercent,
    stockQuantity:   item.stock_quantity,
    badge:           item.badge,
    image:           item.image,
    imageDesc:       item.imageDesc,
    brandLogo:       item.brandLogo,
    status:          effectiveStatus(item),
    sku:             item.sku,
  };
}

const CART_SELECT = `
  SELECT ci.id, ci.quantity,
         ci.selected_size AS selectedSize,
         p.id             AS product_id,
         p.name, p.price, p.sale_price, p.is_on_sale, p.sale_ends_at,
         p.stock_quantity, p.badge, p.image,
         p.image_desc     AS imageDesc,
         p.brand_logo     AS brandLogo,
         p.status, p.sku
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
`;

cartRouterMySQL.use(authenticateToken);

// ── GET /api/cart ──────────────────────────────────────────────────────────
cartRouterMySQL.get("/", async (req: AuthRequest, res: Response) => {
  const cartItems = await dbAll<CartProductRow>(
    `${CART_SELECT} WHERE ci.user_id = ? ORDER BY ci.created_at DESC`,
    [req.userId!],
  );

  const items = cartItems.map((item) => ({
    product:      formatCartProduct(item),
    quantity:     item.quantity,
    selectedSize: (item.selectedSize as string | null) || undefined,
  }));

  const total     = items.reduce((sum, item) => sum + (item.product.salePrice ?? (item.product.price as number)) * (item.quantity as number), 0);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity as number), 0);

  res.json({ items, total, itemCount });
});

// ── POST /api/cart/items ───────────────────────────────────────────────────
cartRouterMySQL.post("/items", async (req: AuthRequest, res: Response) => {
  const { productId, quantity, selectedSize } = validate(addToCartSchema, req.body);

  const product = await dbGet<{ id: string; status: string; stock_quantity: number | null }>(
    "SELECT id, status, stock_quantity FROM products WHERE id = ?",
    [productId],
  );
  if (!product) {
    res.status(404).json({ message: "Product not found", status: 404 });
    return;
  }
  if (product.status === "Out of stock" || (product.stock_quantity !== null && product.stock_quantity < quantity)) {
    res.status(409).json({ message: "This product is out of stock or does not have enough stock available.", status: 409 });
    return;
  }

  const existingItem = await dbGet<{ id: string; quantity: number }>(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))",
    [req.userId!, productId, selectedSize || null, selectedSize || null],
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock_quantity !== null && product.stock_quantity < newQuantity) {
      res.status(409).json({ message: "There is not enough stock available for this quantity.", status: 409 });
      return;
    }
    await dbRun("UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?", [newQuantity, existingItem.id]);
  } else {
    const itemId = generateId();
    await dbRun(
      "INSERT INTO cart_items (id, user_id, product_id, quantity, selected_size) VALUES (?, ?, ?, ?, ?)",
      [itemId, req.userId!, productId, quantity, selectedSize || null],
    );
  }

  const cartItems = await dbAll<CartProductRow>(
    `${CART_SELECT} WHERE ci.user_id = ? ORDER BY ci.created_at DESC`,
    [req.userId!],
  );
  const items = cartItems.map((item) => ({
    product:      formatCartProduct(item),
    quantity:     item.quantity,
    selectedSize: (item.selectedSize as string | null) || undefined,
  }));
  const newItem = items.find(
    (item) => item.product.id === productId && item.selectedSize === selectedSize,
  );
  res.status(201).json(newItem);
});

// ── PATCH /api/cart/items/:id ──────────────────────────────────────────────
cartRouterMySQL.patch("/items/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity } = validate(updateCartItemSchema, req.body);

  const item = await dbGet<{ id: string; product_id: string; status: string; stock_quantity: number | null }>(
    "SELECT ci.id, ci.product_id, p.status, p.stock_quantity FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?",
    [id, req.userId!],
  );
  if (!item) {
    res.status(404).json({ message: "Cart item not found", status: 404 });
    return;
  }
  if (item.status === "Out of stock" || (item.stock_quantity !== null && item.stock_quantity < quantity)) {
    res.status(409).json({ message: "There is not enough stock available for this quantity.", status: 409 });
    return;
  }

  await dbRun("UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?", [quantity, id]);

  const updatedItem = await dbGet<CartProductRow>(
    `${CART_SELECT} WHERE ci.id = ?`,
    [id],
  );
  res.json({
    product:      formatCartProduct(updatedItem!),
    quantity:     updatedItem!.quantity,
    selectedSize: (updatedItem!.selectedSize as string | null) || undefined,
  });
});

// ── DELETE /api/cart/items/:id ─────────────────────────────────────────────
cartRouterMySQL.delete("/items/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const item = await dbGet<{ id: string }>(
    "SELECT id FROM cart_items WHERE id = ? AND user_id = ?",
    [id, req.userId!],
  );
  if (!item) {
    res.status(404).json({ message: "Cart item not found", status: 404 });
    return;
  }

  await dbRun("DELETE FROM cart_items WHERE id = ?", [id]);
  res.status(204).send();
});

// ── DELETE /api/cart ───────────────────────────────────────────────────────
cartRouterMySQL.delete("/", async (req: AuthRequest, res: Response) => {
  await dbRun("DELETE FROM cart_items WHERE user_id = ?", [req.userId!]);
  res.status(204).send();
});
