/**
 * MySQL-compatible versions of simple routes:
 *  - categories-mysql.ts
 *  - occasions-mysql.ts
 *  - wishlist-mysql.ts
 *  - carousel-mysql.ts  (public read-only)
 *  - tracking-mysql.ts  (no DB changes needed, just re-export)
 *
 * All handlers are async, using dbGet/dbAll/dbRun from mysql.ts.
 */

// ─── categories-mysql.ts ───────────────────────────────────────────────────

import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { validate, addToWishlistSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { dbGet, dbAll, dbRun } from "../database/mysql.js";

// ── Categories ─────────────────────────────────────────────────────────────
export const categoriesRouterMySQL = Router();

categoriesRouterMySQL.get("/", async (_req, res: Response) => {
  const categories = await dbAll<{
    id: string; slug: string; name: string; nameAr?: string | null;
    imageType: string; image: string | null; bgColor: string | null;
    sortOrder: number; productCount: number;
  }>(
    `SELECT c.id, c.slug, c.name, c.name_ar AS nameAr,
            c.image_type AS imageType, c.image, c.bg_color AS bgColor,
            c.sort_order AS sortOrder,
            COUNT(p.id) AS productCount
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id, c.slug, c.name, c.name_ar, c.image_type, c.image, c.bg_color, c.sort_order
      ORDER BY c.sort_order, c.name`,
  );
  res.json(categories.map((c) => ({
    id: c.id, slug: c.slug, name: c.name, imageType: c.imageType,
    image: c.image, bgColor: c.bgColor || undefined, nameAr: c.nameAr || undefined,
    productCount: c.productCount,
  })));
});

categoriesRouterMySQL.get("/:slug", async (req, res: Response) => {
  const { slug } = req.params;
  const alias = await dbGet<{ target_slug: string }>(
    "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'categories' AND alias_slug = ?", [slug],
  );
  const resolvedSlug = alias?.target_slug || slug;
  const category = await dbGet<{ id: string; slug: string; name: string; imageType: string; bgColor: string | null; image?: string | null }>(
    "SELECT id, slug, name, image_type AS imageType, bg_color AS bgColor, image FROM categories WHERE slug = ?",
    [resolvedSlug],
  );
  if (!category) {
    res.status(404).json({ message: "Category not found", status: 404 });
    return;
  }
  res.json({
    id: category.id, slug: category.slug, name: category.name,
    imageType: category.imageType, bgColor: category.bgColor || undefined,
    image: category.image || undefined,
  });
});

// ── Occasions ──────────────────────────────────────────────────────────────
export const occasionsRouterMySQL = Router();

occasionsRouterMySQL.get("/", async (_req, res: Response) => {
  const occasions = await dbAll<{
    id: string; slug: string; name: string; nameAr?: string | null;
    imageType: string; image: string | null; sortOrder: number; productCount: number;
  }>(
    `SELECT o.id, o.slug, o.name, o.name_ar AS nameAr,
            o.image_type AS imageType, o.image,
            o.sort_order AS sortOrder,
            COUNT(p.id) AS productCount
       FROM occasions o
       LEFT JOIN products p ON p.occasion_id = o.id
      WHERE o.is_active = 1
      GROUP BY o.id, o.slug, o.name, o.name_ar, o.image_type, o.image, o.sort_order
      ORDER BY o.sort_order, o.name`,
  );
  res.json(occasions.map((o) => ({
    id: o.id, slug: o.slug, name: o.name, imageType: o.imageType,
    image: o.image, nameAr: o.nameAr || undefined, productCount: o.productCount,
  })));
});

occasionsRouterMySQL.get("/:slug", async (req, res: Response) => {
  const { slug } = req.params;
  const alias = await dbGet<{ target_slug: string }>(
    "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'occasions' AND alias_slug = ?", [slug],
  );
  const resolvedSlug = alias?.target_slug || slug;
  const occasion = await dbGet<{ id: string; slug: string; name: string; imageType: string; image?: string | null }>(
    "SELECT id, slug, name, image_type AS imageType, image FROM occasions WHERE slug = ?",
    [resolvedSlug],
  );
  if (!occasion) {
    res.status(404).json({ message: "Occasion not found", status: 404 });
    return;
  }
  res.json({ id: occasion.id, slug: occasion.slug, name: occasion.name, imageType: occasion.imageType, image: occasion.image || undefined });
});

// ── Wishlist ───────────────────────────────────────────────────────────────
export const wishlistRouterMySQL = Router();
wishlistRouterMySQL.use(authenticateToken);

wishlistRouterMySQL.get("/", async (req: AuthRequest, res: Response) => {
  const products = await dbAll<{
    id: string; name: string; price: number; badge: string | null;
    image: string; imageDesc: string | null; brandLogo: string | null;
    status: string; sku: string | null;
  }>(
    `SELECT p.id, p.name, p.price, p.badge, p.image,
            p.image_desc AS imageDesc, p.brand_logo AS brandLogo,
            p.status, p.sku
       FROM wishlist_items wi
       JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC`,
    [req.userId!],
  );
  res.json(products.map((p) => ({
    id: p.id, name: p.name, price: p.price, badge: p.badge,
    image: p.image, imageDesc: p.imageDesc, brandLogo: p.brandLogo,
    status: p.status as "In stock" | "Out of stock", sku: p.sku,
  })));
});

wishlistRouterMySQL.get("/check/:productId", async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const item = await dbGet<{ id: string }>(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    [req.userId!, productId],
  );
  res.json(!!item);
});

wishlistRouterMySQL.post("/items", async (req: AuthRequest, res: Response) => {
  const { productId } = validate(addToWishlistSchema, req.body);
  const product = await dbGet<{
    id: string; name: string; price: number; badge: string | null;
    image: string; image_desc: string | null; brand_logo: string | null;
    status: string; sku: string | null;
  }>("SELECT * FROM products WHERE id = ?", [productId]);
  if (!product) { res.status(404).json({ message: "Product not found", status: 404 }); return; }
  const existing = await dbGet<{ id: string }>(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    [req.userId!, productId],
  );
  if (existing) { res.status(409).json({ message: "Product already in wishlist", status: 409 }); return; }
  const itemId = generateId();
  await dbRun("INSERT INTO wishlist_items (id, user_id, product_id) VALUES (?, ?, ?)", [itemId, req.userId!, productId]);
  res.status(201).json({
    id: product.id, name: product.name, price: product.price, badge: product.badge,
    image: product.image, imageDesc: product.image_desc, brandLogo: product.brand_logo,
    status: product.status as "In stock" | "Out of stock", sku: product.sku,
  });
});

wishlistRouterMySQL.delete("/items/:productId", async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const item = await dbGet<{ id: string }>(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    [req.userId!, productId],
  );
  if (!item) { res.status(404).json({ message: "Wishlist item not found", status: 404 }); return; }
  await dbRun("DELETE FROM wishlist_items WHERE id = ?", [item.id]);
  res.status(204).send();
});

// ── Carousel (public read) ─────────────────────────────────────────────────
export const carouselRouterMySQL = Router();

carouselRouterMySQL.get("/", async (_req, res: Response) => {
  const slides = await dbAll<{
    id: string; image: string; headline: string; headline_ar: string | null;
    sub_headline: string | null; sub_headline_ar: string | null;
    cta_text: string; cta_text_ar: string | null; cta_link: string;
    sort_order: number; is_visible: number;
  }>("SELECT * FROM homepage_carousel WHERE is_visible = 1 ORDER BY sort_order, created_at");
  res.json(slides.map((slide) => ({
    id: slide.id, image: slide.image,
    headline: slide.headline, headlineAr: slide.headline_ar,
    subHeadline: slide.sub_headline, subHeadlineAr: slide.sub_headline_ar,
    ctaText: slide.cta_text, ctaTextAr: slide.cta_text_ar,
    ctaLink: slide.cta_link, sortOrder: slide.sort_order,
    isVisible: Boolean(slide.is_visible),
  })));
});
