/**
 * MySQL-compatible version of routes/admin.ts
 *
 * Key changes:
 *  - All handlers async
 *  - datetime('now') → NOW()
 *  - db.prepare().get/all/run/transaction() → dbGet/dbAll/dbRun/dbTransaction()
 *  - COALESCE(MAX(sort_order), -1) works identically in MySQL
 *  - db.transaction() pattern replaced with dbTransaction()
 */

import { Router, Response } from "express";
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
import { readContactSettings, validateContactSettings, writeContactSettings } from "../utils/contactSettings.js";
import { dbGet, dbAll, dbRun, dbTransaction } from "../database/mysql.js";

export const adminRouterMySQL = Router();

type ProductRow = ProductSaleFields & Record<string, unknown>;

adminRouterMySQL.use(authenticateToken);
adminRouterMySQL.use(requireAdmin);

// ── Contact settings ───────────────────────────────────────────────────────
adminRouterMySQL.get("/settings/contact", (_req, res: Response) => {
  res.json({ data: readContactSettings() });
});
adminRouterMySQL.put("/settings/contact", (req, res: Response) => {
  try {
    const settings = validateContactSettings(req.body);
    writeContactSettings(settings);
    res.json({ data: settings, message: "Contact settings saved." });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid contact settings." });
  }
});

// ── Upload helpers ─────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { files: 8, fileSize: 5 * 1024 * 1024 },
});

function detectImageType(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (buffer.length >= 3  && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (buffer.length >= 8  && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

async function productImages(productId: string): Promise<string[]> {
  const row = await dbGet<{ thumbnails?: string | null }>(
    "SELECT thumbnails FROM product_gallery WHERE product_id = ?", [productId],
  );
  if (!row?.thumbnails) return [];
  try {
    const images = JSON.parse(row.thumbnails);
    return Array.isArray(images) ? images.filter((img): img is string => typeof img === "string") : [];
  } catch { return []; }
}

async function syncProductGallery(productId: string, images: string[]): Promise<void> {
  const existing = await dbGet<{ id: string }>(
    "SELECT id FROM product_gallery WHERE product_id = ?", [productId],
  );
  const gallery = JSON.stringify(images);
  if (existing) {
    await dbRun(
      "UPDATE product_gallery SET main_image = ?, thumbnails = ? WHERE product_id = ?",
      [images[0], gallery, productId],
    );
  } else {
    await dbRun(
      "INSERT INTO product_gallery (id, product_id, main_image, thumbnails) VALUES (?, ?, ?, ?)",
      [generateId(), productId, images[0], gallery],
    );
  }
}

async function deleteProductImageIfUnreferenced(url: unknown): Promise<void> {
  if (typeof url !== "string") return;
  const productRef = await dbGet<{ image: string }>("SELECT image FROM products WHERE image = ?", [url]);
  const galleryRefs = await dbAll<{ thumbnails: string }>("SELECT thumbnails FROM product_gallery WHERE thumbnails LIKE ?", [`%${url}%`]);
  if (productRef || galleryRefs.length > 0) return;
  deleteUploadIfUnreferenced(url);
}

async function processUpload(buffer: Buffer): Promise<{ filename: string; type: string }> {
  const type = detectImageType(buffer);
  if (!type) throw new Error("Invalid image content. Only JPEG, PNG, and WebP images are allowed.");
  const filename = `${randomBytes(16).toString("hex")}.webp`;
  await sharp(buffer).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toFile(resolve(UPLOADS_DIR, filename));
  return { filename, type };
}

async function validateTaxonomyIds(categoryId: unknown, occasionId: unknown): Promise<void> {
  if (categoryId != null && (typeof categoryId !== "string" || !(await dbGet("SELECT id FROM categories WHERE id = ? AND is_active = 1", [categoryId])))) {
    throw new Error("Selected category does not exist or is inactive.");
  }
  if (occasionId != null && (typeof occasionId !== "string" || !(await dbGet("SELECT id FROM occasions WHERE id = ? AND is_active = 1", [occasionId])))) {
    throw new Error("Selected occasion does not exist or is inactive.");
  }
}

type CarouselRow = {
  id: string; image: string; headline: string; headline_ar: string | null;
  sub_headline: string | null; sub_headline_ar: string | null;
  cta_text: string; cta_text_ar: string | null; cta_link: string;
  sort_order: number; is_visible: number;
};

function formatCarouselSlide(slide: CarouselRow) {
  return {
    id: slide.id, image: slide.image, headline: slide.headline,
    headlineAr: slide.headline_ar, subHeadline: slide.sub_headline,
    subHeadlineAr: slide.sub_headline_ar, ctaText: slide.cta_text,
    ctaTextAr: slide.cta_text_ar, ctaLink: slide.cta_link,
    sortOrder: slide.sort_order, isVisible: Boolean(slide.is_visible),
  };
}

// ── Orders ─────────────────────────────────────────────────────────────────
adminRouterMySQL.get("/orders", async (_req, res: Response) => {
  const orders = await dbAll(
    "SELECT id, user_id, status, total, shipping_address, payment_method, created_at, updated_at FROM orders ORDER BY created_at DESC",
  );
  res.json({ data: orders });
});

adminRouterMySQL.patch("/orders/:id", async (req, res: Response) => {
  const { status } = req.body;
  if (!status) { res.status(400).json({ message: "Status is required" }); return; }
  await dbRun("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);
  res.json({ message: "Order status updated", status: 200 });
});

// ── Users ──────────────────────────────────────────────────────────────────
adminRouterMySQL.get("/users", async (_req, res: Response) => {
  const users = await dbAll(
    "SELECT id, email, name, phone, role, created_at, updated_at FROM users ORDER BY created_at DESC",
  );
  res.json({ data: users });
});

// ── Upload ─────────────────────────────────────────────────────────────────
adminRouterMySQL.post(
  "/uploads",
  (req, res, next) => {
    upload.array("images", 8)(req, res, (error) => {
      if (!error) { next(); return; }
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
    if (!files?.length) { res.status(400).json({ message: "At least one image file is required." }); return; }
    const uploaded: Array<{ url: string; filename: string; type: string }> = [];
    try {
      mkdirSync(UPLOADS_DIR, { recursive: true });
      for (const file of files) {
        const result = await processUpload(file.buffer);
        uploaded.push({ url: `${req.protocol}://${req.get("host")}/uploads/${result.filename}`, filename: result.filename, type: result.type });
      }
      res.status(201).json({ data: uploaded });
    } catch (error) {
      for (const file of uploaded) deleteUploadIfUnreferenced(file.url);
      res.status(400).json({ message: error instanceof Error ? error.message : "Image upload failed." });
    }
  },
);

// ── Products ───────────────────────────────────────────────────────────────
adminRouterMySQL.get("/products", async (_req, res: Response) => {
  const rows = await dbAll<ProductRow>("SELECT * FROM products ORDER BY created_at DESC");
  const products = await Promise.all(rows.map(async (product) => ({
    ...product,
    salePrice:       product.sale_price,
    isOnSale:        getEffectiveSale(product).isOnSale,
    discountPercent: getEffectiveSale(product).discountPercent,
    stockQuantity:   product.stock_quantity,
    images:          [product.image, ...(await productImages(String(product.id)))].filter(
      (img, idx, arr): img is string => typeof img === "string" && arr.indexOf(img) === idx,
    ),
  })));
  res.json({ data: products });
});

adminRouterMySQL.post("/products", async (req, res: Response) => {
  const input = validate(createProductSchema, req.body);
  const { name, nameAr, price, badge, image, images, description, descriptionAr, categoryId, occasionId, status, sku, salePrice, isOnSale, saleEndsAt, stockQuantity } = input as typeof input & { images?: string[] };
  try { await validateTaxonomyIds(categoryId, occasionId); } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid taxonomy selection." });
    return;
  }
  const id = generateId();
  await dbRun(
    `INSERT INTO products (id, name, name_ar, price, badge, image, description, description_ar,
       category_id, occasion_id, status, sku, sale_price, is_on_sale, sale_ends_at, stock_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, nameAr || null, price, badge || null, image, description || null, descriptionAr || null,
     categoryId || null, occasionId || null, stockQuantity === 0 ? "Out of stock" : status || "In stock",
     sku || null, salePrice || null, isOnSale ? 1 : 0, saleEndsAt || null, stockQuantity ?? null],
  );
  if (Array.isArray(images) && images.length > 0) await syncProductGallery(id, images);
  res.status(201).json({ id, message: "Product created" });
});

adminRouterMySQL.patch("/products/:id", async (req, res: Response) => {
  const input = validate(updateProductSchema, req.body);
  const { name, nameAr, price, badge, image, images, description, descriptionAr, categoryId, occasionId, status, sku, salePrice, isOnSale, saleEndsAt, stockQuantity } = input as typeof input & { images?: string[] };
  try { await validateTaxonomyIds(categoryId, occasionId); } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid taxonomy selection." });
    return;
  }
  const previous = await dbGet<{ image?: string; price: number; stock_quantity: number | null; sale_ends_at: string | null }>(
    "SELECT image, price, stock_quantity, sale_ends_at FROM products WHERE id = ?", [req.params.id],
  );
  if (!previous) { res.status(404).json({ message: "Product not found." }); return; }
  if (salePrice != null && salePrice >= (price ?? previous.price)) {
    res.status(400).json({ message: "Sale price must be less than the regular price." });
    return;
  }
  const nextStockQuantity = stockQuantity === undefined ? previous.stock_quantity : stockQuantity;
  const nextSaleEndsAt    = saleEndsAt    === undefined ? previous.sale_ends_at  : saleEndsAt;
  const previousImages    = [previous?.image, ...(await productImages(req.params.id))].filter(Boolean);

  await dbRun(
    `UPDATE products SET
       name            = COALESCE(?, name),
       name_ar         = COALESCE(?, name_ar),
       price           = COALESCE(?, price),
       badge           = COALESCE(?, badge),
       image           = COALESCE(?, image),
       description     = COALESCE(?, description),
       description_ar  = COALESCE(?, description_ar),
       category_id     = COALESCE(?, category_id),
       occasion_id     = COALESCE(?, occasion_id),
       sku             = COALESCE(?, sku),
       sale_price      = COALESCE(?, sale_price),
       is_on_sale      = COALESCE(?, is_on_sale),
       sale_ends_at    = ?,
       stock_quantity  = ?,
       status          = CASE WHEN ? = 0 THEN 'Out of stock' ELSE COALESCE(?, status) END,
       updated_at      = NOW()
     WHERE id = ?`,
    [name ?? null, nameAr ?? null, price ?? null, badge ?? null, image ?? null, description ?? null, descriptionAr ?? null, categoryId ?? null, occasionId ?? null, sku ?? null,
     salePrice ?? null, isOnSale == null ? null : isOnSale ? 1 : 0,
     nextSaleEndsAt, nextStockQuantity, nextStockQuantity, status ?? null, req.params.id],
  );

  if (Array.isArray(images) && images.length > 0) await syncProductGallery(req.params.id, images);
  const currentReferences = new Set([image, ...(Array.isArray(images) ? images : [])].filter(Boolean));
  for (const oldImage of previousImages) {
    if (!currentReferences.has(oldImage)) await deleteProductImageIfUnreferenced(oldImage);
  }
  res.json({ message: "Product updated" });
});

adminRouterMySQL.post("/products/bulk", async (req, res: Response) => {
  const { ids, action, salePrice, salePercent, saleEndsAt } = req.body as {
    ids?: string[]; action?: "sale" | "out_of_stock";
    salePrice?: number; salePercent?: number; saleEndsAt?: string | null;
  };
  if (!Array.isArray(ids) || ids.length === 0 || !["sale", "out_of_stock"].includes(action || "")) {
    res.status(400).json({ message: "Product IDs and a valid bulk action are required." });
    return;
  }
  if (action === "sale" && ((!Number.isFinite(salePrice) || Number(salePrice) <= 0) && (!Number.isFinite(salePercent) || Number(salePercent) <= 0 || Number(salePercent) >= 100))) {
    res.status(400).json({ message: "A positive sale price or a discount percentage between 0 and 100 is required." });
    return;
  }
  try {
    await dbTransaction(async (conn) => {
      for (const id of ids) {
        if (action === "out_of_stock") {
          await conn.execute("UPDATE products SET status = 'Out of stock', updated_at = NOW() WHERE id = ?", [id]);
        } else {
          const [rows] = await conn.execute<any[]>("SELECT price FROM products WHERE id = ?", [id]);
          const product = (rows as any[])[0] as { price: number } | undefined;
          if (!product) throw new Error("One or more selected products could not be found.");
          const productSalePrice = Number.isFinite(salePercent)
            ? Number((product.price * (1 - Number(salePercent) / 100)).toFixed(2))
            : Number(salePrice);
          if (productSalePrice <= 0 || productSalePrice >= product.price) throw new Error("Sale price must be less than each product's price.");
          await conn.execute(
            "UPDATE products SET sale_price = ?, is_on_sale = 1, sale_ends_at = ?, updated_at = NOW() WHERE id = ?",
            [productSalePrice, saleEndsAt || null, id],
          );
        }
      }
    });
    res.json({ message: "Bulk product action completed." });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Bulk action failed." });
  }
});

adminRouterMySQL.delete("/products/:id", async (req, res: Response) => {
  const previous = await dbGet<{ image?: string }>("SELECT image FROM products WHERE id = ?", [req.params.id]);
  const previousImages = [previous?.image, ...(await productImages(req.params.id))].filter(Boolean);
  await dbRun("DELETE FROM product_gallery WHERE product_id = ?", [req.params.id]);
  await dbRun("DELETE FROM products WHERE id = ?", [req.params.id]);
  for (const image of previousImages) await deleteProductImageIfUnreferenced(image);
  res.json({ message: "Product deleted" });
});

// ── Carousel ───────────────────────────────────────────────────────────────
adminRouterMySQL.get("/carousel", async (_req, res: Response) => {
  const slides = await dbAll<CarouselRow>("SELECT * FROM homepage_carousel ORDER BY sort_order, created_at");
  res.json({ data: slides.map(formatCarouselSlide) });
});

adminRouterMySQL.post("/carousel", async (req, res: Response) => {
  const { image, headline, headlineAr, subHeadline, subHeadlineAr, ctaText, ctaTextAr, ctaLink, isVisible } = req.body;
  if (typeof image !== "string" || !/^https?:\/\/.+/i.test(image)) { res.status(400).json({ message: "A valid slide image URL is required." }); return; }
  if (typeof headline !== "string" || !headline.trim()) { res.status(400).json({ message: "Slide headline is required." }); return; }
  if (typeof ctaText !== "string" || !ctaText.trim()) { res.status(400).json({ message: "Slide button text is required." }); return; }
  if (typeof ctaLink !== "string" || !/^(?:\/(?!\/)|https?:\/\/.+)/i.test(ctaLink)) { res.status(400).json({ message: "Slide link must be a site path or valid URL." }); return; }
  const maxRow = await dbGet<{ maxOrder: number }>("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM homepage_carousel");
  const id = generateId();
  await dbRun(
    `INSERT INTO homepage_carousel
       (id, image, headline, headline_ar, sub_headline, sub_headline_ar, cta_text, cta_text_ar, cta_link, sort_order, is_visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, image.trim(), headline.trim(), headlineAr || null, subHeadline || null, subHeadlineAr || null,
     ctaText.trim(), ctaTextAr || null, ctaLink.trim(), (maxRow?.maxOrder ?? -1) + 1, isVisible === false ? 0 : 1],
  );
  const slide = await dbGet<CarouselRow>("SELECT * FROM homepage_carousel WHERE id = ?", [id]);
  res.status(201).json({ data: formatCarouselSlide(slide!) });
});

adminRouterMySQL.patch("/carousel/reorder", async (req, res: Response) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) { res.status(400).json({ message: "A valid slide order is required." }); return; }
  const existing = await dbAll<{ id: string }>("SELECT id FROM homepage_carousel");
  if (ids.length !== existing.length || new Set(ids).size !== ids.length || ids.some((id: string) => !existing.some((s) => s.id === id))) {
    res.status(400).json({ message: "The slide order does not match the saved slides." }); return;
  }
  await dbTransaction(async (conn) => {
    for (let index = 0; index < ids.length; index++) {
      await conn.execute("UPDATE homepage_carousel SET sort_order = ?, updated_at = NOW() WHERE id = ?", [index, ids[index]]);
    }
  });
  res.json({ message: "Carousel order updated." });
});

adminRouterMySQL.patch("/carousel/:id", async (req, res: Response) => {
  const { image, headline, headlineAr, subHeadline, subHeadlineAr, ctaText, ctaTextAr, ctaLink, isVisible } = req.body;
  const current = await dbGet<CarouselRow>("SELECT * FROM homepage_carousel WHERE id = ?", [req.params.id]);
  if (!current) { res.status(404).json({ message: "Carousel slide not found." }); return; }
  if (image !== undefined && (typeof image !== "string" || !/^https?:\/\/.+/i.test(image))) { res.status(400).json({ message: "A valid slide image URL is required." }); return; }
  if (ctaLink !== undefined && (typeof ctaLink !== "string" || !/^(?:\/(?!\/)|https?:\/\/.+)/i.test(ctaLink))) { res.status(400).json({ message: "Slide link must be a site path or valid URL." }); return; }
  await dbRun(
    `UPDATE homepage_carousel
       SET image = ?, headline = ?, headline_ar = ?, sub_headline = ?, sub_headline_ar = ?,
           cta_text = ?, cta_text_ar = ?, cta_link = ?, is_visible = ?, updated_at = NOW()
     WHERE id = ?`,
    [image ?? current.image, headline ?? current.headline, headlineAr ?? current.headline_ar,
     subHeadline ?? current.sub_headline, subHeadlineAr ?? current.sub_headline_ar,
     ctaText ?? current.cta_text, ctaTextAr ?? current.cta_text_ar, ctaLink ?? current.cta_link,
     isVisible === undefined ? current.is_visible : isVisible ? 1 : 0, req.params.id],
  );
  const updated = await dbGet<CarouselRow>("SELECT * FROM homepage_carousel WHERE id = ?", [req.params.id]);
  res.json({ data: formatCarouselSlide(updated!) });
});

adminRouterMySQL.delete("/carousel/:id", async (req, res: Response) => {
  const slide = await dbGet<{ image?: string }>("SELECT image FROM homepage_carousel WHERE id = ?", [req.params.id]);
  if (!slide) { res.status(404).json({ message: "Carousel slide not found." }); return; }
  await dbRun("DELETE FROM homepage_carousel WHERE id = ?", [req.params.id]);
  deleteUploadIfUnreferenced(slide.image);
  res.json({ message: "Carousel slide deleted." });
});

// ── Categories ─────────────────────────────────────────────────────────────
adminRouterMySQL.post("/categories", async (req, res: Response) => {
  const { name, slug: requestedSlug, image_type, imageType, bg_color, bgColor, image, name_ar, nameAr, sort_order, sortOrder, is_active, isActive } = req.body;
  if (!name?.trim()) { res.status(400).json({ message: "Category name is required." }); return; }
  const id   = generateId();
  const slug = requestedSlug || generateSlug(name);
  await dbRun(
    "INSERT INTO categories (id, name, slug, image_type, image, name_ar, bg_color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, name.trim(), slug, image_type || imageType || null, image || null,
     name_ar || nameAr || null, bg_color || bgColor || null,
     sort_order ?? sortOrder ?? 0, is_active ?? isActive ?? 1],
  );
  res.status(201).json({ id, message: "Category created" });
});

adminRouterMySQL.patch("/categories/:id", async (req, res: Response) => {
  const { name, slug: requestedSlug, image_type, imageType, bg_color, bgColor, image, name_ar, nameAr, sort_order, sortOrder, is_active, isActive } = req.body;
  let slug = requestedSlug || null;
  if (name && !slug) slug = generateSlug(name);
  await dbRun(
    `UPDATE categories SET
       name       = COALESCE(?, name),
       slug       = COALESCE(?, slug),
       image_type = COALESCE(?, image_type),
       image      = COALESCE(?, image),
       name_ar    = COALESCE(?, name_ar),
       bg_color   = COALESCE(?, bg_color),
       sort_order = COALESCE(?, sort_order),
       is_active  = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, slug, image_type ?? imageType, image, name_ar ?? nameAr, bg_color ?? bgColor,
     sort_order ?? sortOrder, is_active ?? isActive, req.params.id],
  );
  res.json({ message: "Category updated" });
});

adminRouterMySQL.delete("/categories/:id", async (req, res: Response) => {
  const linked = await dbGet<{ count: number }>(
    "SELECT COUNT(*) AS count FROM products WHERE category_id = ?", [req.params.id],
  );
  if ((linked?.count ?? 0) > 0) { res.status(409).json({ message: "Cannot delete a category with products. Reassign the products first." }); return; }
  await dbRun("DELETE FROM categories WHERE id = ?", [req.params.id]);
  res.json({ message: "Category deleted" });
});

// ── Occasions ──────────────────────────────────────────────────────────────
adminRouterMySQL.post("/occasions", async (req, res: Response) => {
  const { name, slug: requestedSlug, image_type, imageType, image, name_ar, nameAr, sort_order, sortOrder, is_active, isActive } = req.body;
  if (!name?.trim()) { res.status(400).json({ message: "Occasion name is required." }); return; }
  const id   = generateId();
  const slug = requestedSlug || generateSlug(name);
  await dbRun(
    "INSERT INTO occasions (id, name, slug, image_type, image, name_ar, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, name.trim(), slug, image_type || imageType || null, image || null,
     name_ar || nameAr || null, sort_order ?? sortOrder ?? 0, is_active ?? isActive ?? 1],
  );
  res.status(201).json({ id, message: "Occasion created" });
});

adminRouterMySQL.patch("/occasions/:id", async (req, res: Response) => {
  const { name, slug: requestedSlug, image_type, imageType, image, name_ar, nameAr, sort_order, sortOrder, is_active, isActive } = req.body;
  let slug = requestedSlug || null;
  if (name && !slug) slug = generateSlug(name);
  await dbRun(
    `UPDATE occasions SET
       name       = COALESCE(?, name),
       slug       = COALESCE(?, slug),
       image_type = COALESCE(?, image_type),
       image      = COALESCE(?, image),
       name_ar    = COALESCE(?, name_ar),
       sort_order = COALESCE(?, sort_order),
       is_active  = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, slug, image_type ?? imageType, image, name_ar ?? nameAr, sort_order ?? sortOrder, is_active ?? isActive, req.params.id],
  );
  res.json({ message: "Occasion updated" });
});

adminRouterMySQL.delete("/occasions/:id", async (req, res: Response) => {
  const linked = await dbGet<{ count: number }>(
    "SELECT COUNT(*) AS count FROM products WHERE occasion_id = ?", [req.params.id],
  );
  if ((linked?.count ?? 0) > 0) { res.status(409).json({ message: "Cannot delete an occasion with products. Reassign the products first." }); return; }
  await dbRun("DELETE FROM occasions WHERE id = ?", [req.params.id]);
  res.json({ message: "Occasion deleted" });
});
