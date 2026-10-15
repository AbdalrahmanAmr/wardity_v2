import { Router, Response } from "express";
import { db } from "../database/init.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { generateId, generateSlug } from "../utils/id.js";
import multer from "multer";
import sharp from "sharp";
import { randomBytes } from "crypto";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { UPLOADS_DIR, deleteUploadIfUnreferenced } from "../utils/uploads.js";
import { validate, createProductSchema, updateProductSchema } from "../utils/validation.js";
import { getEffectiveSale, ProductSaleFields } from "../utils/productPricing.js";

export const adminRouter = Router();

adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 8, fileSize: 5 * 1024 * 1024 },
});

function detectImageType(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

function productImages(productId: string): string[] {
  const row = db.prepare("SELECT thumbnails FROM product_gallery WHERE product_id = ?").get(productId) as { thumbnails?: string | null } | undefined;
  if (!row?.thumbnails) return [];
  try {
    const images = JSON.parse(row.thumbnails);
    return Array.isArray(images) ? images.filter((image): image is string => typeof image === "string") : [];
  } catch {
    return [];
  }
}

function syncProductGallery(productId: string, images: string[]): void {
  const existing = db.prepare("SELECT id FROM product_gallery WHERE product_id = ?").get(productId) as { id: string } | undefined;
  const gallery = JSON.stringify(images);
  if (existing) {
    db.prepare("UPDATE product_gallery SET main_image = ?, thumbnails = ? WHERE product_id = ?").run(images[0], gallery, productId);
  } else {
    db.prepare("INSERT INTO product_gallery (id, product_id, main_image, thumbnails) VALUES (?, ?, ?, ?)").run(generateId(), productId, images[0], gallery);
  }
}

function deleteProductImageIfUnreferenced(url: unknown): void {
  if (typeof url !== "string") return;
  const productReferences = db.prepare("SELECT image FROM products WHERE image = ?").get(url);
  const galleryReferences = db.prepare("SELECT thumbnails FROM product_gallery WHERE thumbnails LIKE ?").all(`%${url}%`);
  if (productReferences || galleryReferences.length > 0) return;
  deleteUploadIfUnreferenced(url);
}

async function processUpload(buffer: Buffer): Promise<{ filename: string; type: string }> {
  const type = detectImageType(buffer);
  if (!type) throw new Error("Invalid image content. Only JPEG, PNG, and WebP images are allowed.");
  const filename = `${randomBytes(16).toString("hex")}.webp`;
  await sharp(buffer).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toFile(resolve(UPLOADS_DIR, filename));
  return { filename, type };
}

// ================= ORDERS =================

adminRouter.get("/orders", (_req, res: Response) => {
  const orders = db.prepare(`
    SELECT id, user_id, status, total, shipping_address, payment_method, created_at, updated_at 
    FROM orders ORDER BY created_at DESC
  `).all();
  res.json({ data: orders });
});

adminRouter.patch("/orders/:id", (req, res: Response) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ message: "Status is required" });
    return;
  }
  
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ message: "Order status updated", status: 200 });
});

// ================= USERS =================

adminRouter.get("/users", (_req, res: Response) => {
  const users = db.prepare(`
    SELECT id, email, name, phone, role, created_at, updated_at FROM users ORDER BY created_at DESC
  `).all();
  res.json({ data: users });
});

// ================= PRODUCTS =================

adminRouter.post(
  "/uploads",
  (req, res, next) => {
    upload.array("images", 8)(req, res, (error) => {
      if (!error) {
        next();
        return;
      }
      if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 5 MB or smaller."
          : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
            ? "You can upload up to 8 images at a time."
            : error.message;
        res.status(400).json({ message });
        return;
      }
      next(error);
    });
  },
  async (req, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    res.status(400).json({ message: "At least one image file is required." });
    return;
  }
  const uploaded: Array<{ url: string; filename: string; type: string }> = [];
  try {
    mkdirSync(UPLOADS_DIR, { recursive: true });
    for (const file of files) {
      const result = await processUpload(file.buffer);
      uploaded.push({
        url: `${req.protocol}://${req.get("host")}/uploads/${result.filename}`,
        filename: result.filename,
        type: result.type,
      });
    }
    res.status(201).json({ data: uploaded });
  } catch (error) {
    for (const file of uploaded) deleteUploadIfUnreferenced(file.url);
    res.status(400).json({ message: error instanceof Error ? error.message : "Image upload failed." });
  }
  },
);

adminRouter.get("/products", (_req, res: Response) => {
  const products = (db.prepare("SELECT * FROM products ORDER BY created_at DESC").all() as Array<Record<string, any>>).map((product) => ({
    ...product,
    salePrice: product.sale_price,
    isOnSale: getEffectiveSale(product as ProductSaleFields).isOnSale,
    discountPercent: getEffectiveSale(product as ProductSaleFields).discountPercent,
    stockQuantity: product.stock_quantity,
    images: [product.image, ...productImages(String(product.id))].filter(
      (image, index, images): image is string => typeof image === "string" && images.indexOf(image) === index,
    ),
  }));
  res.json({ data: products });
});

adminRouter.post("/products", (req, res: Response) => {
  const input = validate(createProductSchema, req.body);
  const { name, price, badge, image, images, description, categoryId, occasionId, status, sku, salePrice, isOnSale, saleEndsAt, stockQuantity } = input as typeof input & { images?: string[] };
  const id = generateId();
  db.prepare(`
    INSERT INTO products (id, name, price, badge, image, description, category_id, occasion_id, status, sku, sale_price, is_on_sale, sale_ends_at, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, price, badge || null, image, description || null, categoryId || null, occasionId || null, stockQuantity === 0 ? "Out of stock" : status || "In stock", sku || null, salePrice || null, isOnSale ? 1 : 0, saleEndsAt || null, stockQuantity ?? null);
  if (Array.isArray(images) && images.length > 0) syncProductGallery(id, images);
  res.status(201).json({ id, message: "Product created" });
});

adminRouter.patch("/products/:id", (req, res: Response) => {
  const input = validate(updateProductSchema, req.body);
  const { name, price, badge, image, images, description, categoryId, occasionId, status, sku, salePrice, isOnSale, saleEndsAt, stockQuantity } = input as typeof input & { images?: string[] };
  const previous = db.prepare("SELECT image, price, stock_quantity, sale_ends_at FROM products WHERE id = ?").get(req.params.id) as { image?: string; price: number; stock_quantity: number | null; sale_ends_at: string | null } | undefined;
  if (!previous) {
    res.status(404).json({ message: "Product not found." });
    return;
  }
  if (salePrice != null && salePrice >= (price ?? previous.price)) {
    res.status(400).json({ message: "Sale price must be less than the regular price." });
    return;
  }
  const nextStockQuantity = stockQuantity === undefined ? previous.stock_quantity : stockQuantity;
  const nextSaleEndsAt = saleEndsAt === undefined ? previous.sale_ends_at : saleEndsAt;
  const previousImages = [previous?.image, ...productImages(req.params.id)].filter(Boolean);
  db.prepare(`
    UPDATE products SET 
      name = COALESCE(?, name),
      price = COALESCE(?, price),
      badge = COALESCE(?, badge),
      image = COALESCE(?, image),
      description = COALESCE(?, description),
      category_id = COALESCE(?, category_id),
      occasion_id = COALESCE(?, occasion_id),
      sku = COALESCE(?, sku),
      sale_price = COALESCE(?, sale_price),
      is_on_sale = COALESCE(?, is_on_sale),
      sale_ends_at = ?,
      stock_quantity = ?,
      status = CASE WHEN ? = 0 THEN 'Out of stock' ELSE COALESCE(?, status) END,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, price, badge, image, description, categoryId, occasionId, sku, salePrice, isOnSale == null ? null : isOnSale ? 1 : 0, nextSaleEndsAt, nextStockQuantity, nextStockQuantity, status, req.params.id);
  if (Array.isArray(images) && images.length > 0) syncProductGallery(req.params.id, images);
  const currentReferences = new Set([image, ...(Array.isArray(images) ? images : [])].filter(Boolean));
  for (const oldImage of previousImages) {
    if (!currentReferences.has(oldImage)) deleteProductImageIfUnreferenced(oldImage);
  }
  res.json({ message: "Product updated" });
});

adminRouter.post("/products/bulk", (req, res: Response) => {
  const { ids, action, salePrice, salePercent, saleEndsAt } = req.body as { ids?: string[]; action?: "sale" | "out_of_stock"; salePrice?: number; salePercent?: number; saleEndsAt?: string | null };
  if (!Array.isArray(ids) || ids.length === 0 || !["sale", "out_of_stock"].includes(action || "")) {
    res.status(400).json({ message: "Product IDs and a valid bulk action are required." });
    return;
  }
  if (action === "sale" && ((!Number.isFinite(salePrice) || Number(salePrice) <= 0) && (!Number.isFinite(salePercent) || Number(salePercent) <= 0 || Number(salePercent) >= 100))) {
    res.status(400).json({ message: "A positive sale price or a discount percentage between 0 and 100 is required." });
    return;
  }
  const update = db.transaction(() => {
    for (const id of ids) {
      if (action === "out_of_stock") {
        db.prepare("UPDATE products SET status = 'Out of stock', updated_at = datetime('now') WHERE id = ?").run(id);
      } else {
        const product = db.prepare("SELECT price FROM products WHERE id = ?").get(id) as { price: number } | undefined;
        if (!product) throw new Error("One or more selected products could not be found.");
        const productSalePrice = Number.isFinite(salePercent) ? Number((product.price * (1 - Number(salePercent) / 100)).toFixed(2)) : Number(salePrice);
        if (productSalePrice <= 0 || productSalePrice >= product.price) throw new Error("Sale price must be less than each product's price.");
        db.prepare("UPDATE products SET sale_price = ?, is_on_sale = 1, sale_ends_at = ?, updated_at = datetime('now') WHERE id = ?")
          .run(productSalePrice, saleEndsAt || null, id);
      }
    }
  });
  try { update(); res.json({ message: "Bulk product action completed." }); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : "Bulk action failed." }); }
});

adminRouter.delete("/products/:id", (req, res: Response) => {
  const previous = db.prepare("SELECT image FROM products WHERE id = ?").get(req.params.id) as { image?: string } | undefined;
  const previousImages = [previous?.image, ...productImages(req.params.id)].filter(Boolean);
  db.prepare("DELETE FROM product_gallery WHERE product_id = ?").run(req.params.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  for (const image of previousImages) deleteProductImageIfUnreferenced(image);
  res.json({ message: "Product deleted" });
});

// ================= CATEGORIES =================

adminRouter.post("/categories", (req, res: Response) => {
  const { name, image_type, imageType, bg_color, bgColor } = req.body;
  const id = generateId();
  const slug = generateSlug(name);
  db.prepare(`
    INSERT INTO categories (id, name, slug, image_type, bg_color) VALUES (?, ?, ?, ?, ?)
  `).run(id, name, slug, image_type || imageType || null, bg_color || bgColor || null);
  res.status(201).json({ id, message: "Category created" });
});

adminRouter.patch("/categories/:id", (req, res: Response) => {
  const { name, image_type, imageType, bg_color, bgColor } = req.body;
  let slug = null;
  if (name) slug = generateSlug(name);
  db.prepare(`
    UPDATE categories SET 
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      image_type = COALESCE(?, image_type),
      bg_color = COALESCE(?, bg_color)
    WHERE id = ?
  `).run(name, slug, image_type ?? imageType, bg_color ?? bgColor, req.params.id);
  res.json({ message: "Category updated" });
});

adminRouter.delete("/categories/:id", (req, res: Response) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ message: "Category deleted" });
});

// ================= OCCASIONS =================

adminRouter.post("/occasions", (req, res: Response) => {
  const { name, image_type, imageType } = req.body;
  const id = generateId();
  const slug = generateSlug(name);
  db.prepare(`
    INSERT INTO occasions (id, name, slug, image_type) VALUES (?, ?, ?, ?)
  `).run(id, name, slug, image_type || imageType || null);
  res.status(201).json({ id, message: "Occasion created" });
});

adminRouter.patch("/occasions/:id", (req, res: Response) => {
  const { name, image_type, imageType } = req.body;
  let slug = null;
  if (name) slug = generateSlug(name);
  db.prepare(`
    UPDATE occasions SET 
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      image_type = COALESCE(?, image_type)
    WHERE id = ?
  `).run(name, slug, image_type ?? imageType, req.params.id);
  res.json({ message: "Occasion updated" });
});

adminRouter.delete("/occasions/:id", (req, res: Response) => {
  db.prepare("DELETE FROM occasions WHERE id = ?").run(req.params.id);
  res.json({ message: "Occasion deleted" });
});
