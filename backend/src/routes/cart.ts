import { Router, Response } from "express";
import { db } from "../database/init.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { validate, addToCartSchema, updateCartItemSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { effectiveStatus, getEffectiveSale, ProductSaleFields } from "../utils/productPricing.js";

export const cartRouter = Router();

function formatCartProduct(item: Record<string, any>) {
  const sale = getEffectiveSale(item as ProductSaleFields);
  return {
    id: item.product_id,
    name: item.name,
    price: item.price,
    salePrice: sale.salePrice,
    isOnSale: sale.isOnSale,
    discountPercent: sale.discountPercent,
    stockQuantity: item.stock_quantity,
    badge: item.badge,
    image: item.image,
    imageDesc: item.imageDesc,
    brandLogo: item.brandLogo,
    status: effectiveStatus(item as ProductSaleFields),
    sku: item.sku,
  };
}

// All cart routes require authentication
cartRouter.use(authenticateToken);

/**
 * GET /api/cart
 * Get current user's cart
 */
cartRouter.get("/", (req: AuthRequest, res: Response) => {
  const cartItems = db
    .prepare(
      `
      SELECT 
        ci.id,
        ci.quantity,
        ci.selected_size as selectedSize,
        p.id as product_id,
        p.name,
        p.price,
        p.sale_price,
        p.is_on_sale,
        p.sale_ends_at,
        p.stock_quantity,
        p.badge,
        p.image,
        p.image_desc as imageDesc,
        p.brand_logo as brandLogo,
        p.status,
        p.sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `
    )
    .all(req.userId!) as Array<{
    id: string;
    quantity: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    price: number;
    badge: string | null;
    image: string;
    imageDesc: string | null;
    brandLogo: string | null;
    status: string;
    sku: string | null;
  }>;

  const items = cartItems.map((item) => ({
    product: formatCartProduct(item),
    quantity: item.quantity,
    selectedSize: item.selectedSize || undefined,
  }));

  const total = items.reduce(
    (sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    items,
    total,
    itemCount,
  });
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
cartRouter.post("/items", (req: AuthRequest, res: Response) => {
  const { productId, quantity, selectedSize } = validate(
    addToCartSchema,
    req.body
  );

  // Check if product exists
  const product = db
    .prepare("SELECT id, status, stock_quantity FROM products WHERE id = ?")
    .get(productId) as { id: string; status: string; stock_quantity: number | null } | undefined;

  if (!product) {
    res.status(404).json({
      message: "Product not found",
      status: 404,
    });
    return;
  }
  if (product.status === "Out of stock" || (product.stock_quantity !== null && product.stock_quantity < quantity)) {
    res.status(409).json({ message: "This product is out of stock or does not have enough stock available.", status: 409 });
    return;
  }

  // Check if item already exists in cart
  const existingItem = db
    .prepare(
      "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))"
    )
    .get(req.userId!, productId, selectedSize || null, selectedSize || null) as
    | { id: string; quantity: number }
    | undefined;

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock_quantity !== null && product.stock_quantity < newQuantity) {
      res.status(409).json({ message: "There is not enough stock available for this quantity.", status: 409 });
      return;
    }
    db.prepare("UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
      newQuantity,
      existingItem.id
    );
  } else {
    // Create new cart item
    const itemId = generateId();
    db.prepare(
      "INSERT INTO cart_items (id, user_id, product_id, quantity, selected_size) VALUES (?, ?, ?, ?, ?)"
    ).run(itemId, req.userId!, productId, quantity, selectedSize || null);
  }

  // Return updated cart
  const cartItems = db
    .prepare(
      `
      SELECT 
        ci.id,
        ci.quantity,
        ci.selected_size as selectedSize,
        p.id as product_id,
        p.name,
        p.price,
        p.sale_price,
        p.is_on_sale,
        p.sale_ends_at,
        p.stock_quantity,
        p.badge,
        p.image,
        p.image_desc as imageDesc,
        p.brand_logo as brandLogo,
        p.status,
        p.sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `
    )
    .all(req.userId!) as Array<{
    id: string;
    quantity: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    price: number;
    badge: string | null;
    image: string;
    imageDesc: string | null;
    brandLogo: string | null;
    status: string;
    sku: string | null;
  }>;

  const items = cartItems.map((item) => ({
    product: formatCartProduct(item),
    quantity: item.quantity,
    selectedSize: item.selectedSize || undefined,
  }));

  const newItem = items.find(
    (item) =>
      item.product.id === productId &&
      item.selectedSize === selectedSize
  );

  res.status(201).json(newItem);
});

/**
 * PATCH /api/cart/items/:id
 * Update cart item quantity
 */
cartRouter.patch("/items/:id", (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity } = validate(updateCartItemSchema, req.body);

  // Check if item exists and belongs to user
  const item = db
    .prepare("SELECT ci.id, ci.product_id, p.status, p.stock_quantity FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?")
    .get(id, req.userId!) as { id: string; product_id: string; status: string; stock_quantity: number | null } | undefined;

  if (!item) {
    res.status(404).json({
      message: "Cart item not found",
      status: 404,
    });
    return;
  }
  if (item.status === "Out of stock" || (item.stock_quantity !== null && item.stock_quantity < quantity)) {
    res.status(409).json({ message: "There is not enough stock available for this quantity.", status: 409 });
    return;
  }

  // Update quantity
  db.prepare(
    "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(quantity, id);

  // Return updated item
  const updatedItem = db
    .prepare(
      `
      SELECT 
        ci.id,
        ci.quantity,
        ci.selected_size as selectedSize,
        p.id as product_id,
        p.name,
        p.price,
        p.sale_price,
        p.is_on_sale,
        p.sale_ends_at,
        p.stock_quantity,
        p.badge,
        p.image,
        p.image_desc as imageDesc,
        p.brand_logo as brandLogo,
        p.status,
        p.sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ?
    `
    )
    .get(id) as {
    id: string;
    quantity: number;
    selectedSize: string | null;
    product_id: string;
    name: string;
    price: number;
    badge: string | null;
    image: string;
    imageDesc: string | null;
    brandLogo: string | null;
    status: string;
    sku: string | null;
  };

  res.json({
    product: formatCartProduct(updatedItem),
    quantity: updatedItem.quantity,
    selectedSize: updatedItem.selectedSize || undefined,
  });
});

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 */
cartRouter.delete("/items/:id", (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if item exists and belongs to user
  const item = db
    .prepare("SELECT * FROM cart_items WHERE id = ? AND user_id = ?")
    .get(id, req.userId!) as { id: string } | undefined;

  if (!item) {
    res.status(404).json({
      message: "Cart item not found",
      status: 404,
    });
    return;
  }

  db.prepare("DELETE FROM cart_items WHERE id = ?").run(id);

  res.status(204).send();
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
cartRouter.delete("/", (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.userId!);

  res.status(204).send();
});
