/**
 * MySQL-compatible version of routes/products.ts
 *
 * Key changes:
 *  - Async handlers
 *  - "COLLATE NOCASE" → MySQL case-insensitivity is via the collation
 *    set at DB level (utf8mb4_unicode_ci), so COLLATE clauses are removed.
 *    MySQL comparisons against a ci collation column are already case-insensitive.
 *  - db.prepare().get/all() → await dbGet/dbAll()
 */

import { Router, Response } from "express";
import { getEffectiveSale, effectiveStatus, ProductSaleFields } from "../utils/productPricing.js";
import { dbGet, dbAll } from "../database/mysql.js";
import type { ExecuteValues } from "mysql2/promise";

export const productsRouterMySQL = Router();

type ProductRow = ProductSaleFields & Record<string, unknown>;

function formatProduct(product: ProductRow, language = "en") {
  const sale = getEffectiveSale(product);
  return {
    id:              product.id,
    name:            language === "ar" && product.name_ar ? product.name_ar : product.name,
    price:           product.price,
    salePrice:       sale.salePrice,
    isOnSale:        sale.isOnSale,
    discountPercent: sale.discountPercent,
    saleEndsAt:      product.sale_ends_at,
    stockQuantity:   product.stock_quantity,
    badge:           product.badge,
    image:           product.image,
    imageDesc:       product.image_desc,
    brandLogo:       product.brand_logo,
    status:          effectiveStatus(product),
    sku:             product.sku,
    nameAr:          product.name_ar,
    description:     language === "ar" && product.description_ar ? product.description_ar : product.description,
    descriptionAr:   product.description_ar,
    categoryId:      product.category_id,
    occasionId:      product.occasion_id,
  };
}

// ── GET /api/products ──────────────────────────────────────────────────────
productsRouterMySQL.get("/", async (req, res: Response) => {
  const {
    page = "1", pageSize = "20",
    category, occasion, search, minPrice, maxPrice, status, badge, bestSeller,
  } = req.query;
  const language = req.query.lang === "ar" || String(req.headers["accept-language"] || "").toLowerCase().startsWith("ar") ? "ar" : "en";

  const pageNum     = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);
  const offset      = (pageNum - 1) * pageSizeNum;

  let query   = "SELECT * FROM products WHERE 1=1";
  const params: ExecuteValues[] = [];

  if (typeof category === "string") {
    const alias = await dbGet<{ target_slug: string }>(
      "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'categories' AND alias_slug = ?",
      [category],
    );
    const resolvedCategory = alias?.target_slug || category;
    // MySQL with utf8mb4_unicode_ci is already case-insensitive — no COLLATE NOCASE needed
    query += " AND (category_id = ? OR category_id IN (SELECT id FROM categories WHERE name = ? OR slug = ?))";
    params.push(resolvedCategory, resolvedCategory, resolvedCategory);
  }

  if (typeof occasion === "string") {
    const alias = await dbGet<{ target_slug: string }>(
      "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'occasions' AND alias_slug = ?",
      [occasion],
    );
    const resolvedOccasion = alias?.target_slug || occasion;
    query += " AND (occasion_id = ? OR occasion_id IN (SELECT id FROM occasions WHERE name = ? OR slug = ?))";
    params.push(resolvedOccasion, resolvedOccasion, resolvedOccasion);
  }

  if (typeof badge === "string") {
    query += " AND badge = ?";
    params.push(badge);
  } else if (bestSeller === "true") {
    query += " AND badge = 'Best Seller'";
  }

  if (typeof search === "string") {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  if (typeof minPrice === "string") { query += " AND price >= ?"; params.push(parseFloat(minPrice)); }
  if (typeof maxPrice === "string") { query += " AND price <= ?"; params.push(parseFloat(maxPrice)); }
  if (typeof status === "string")   { query += " AND status = ?"; params.push(status); }

  // Count
  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) AS count");
  const totalResult = await dbGet<{ count: number }>(countQuery, params);
  const total = totalResult?.count ?? 0;

  // Paginated fetch
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(pageSizeNum, offset);
  const products = await dbAll<ProductRow>(query, params);

  const formattedProducts = products.map((p) => formatProduct(p, language));
  const totalPages = Math.ceil(total / pageSizeNum);

  res.json({ data: formattedProducts, total, page: pageNum, pageSize: pageSizeNum, totalPages });
});

// ── GET /api/products/search ───────────────────────────────────────────────
productsRouterMySQL.get("/search", async (req, res: Response) => {
  const { q } = req.query;
  const language = req.query.lang === "ar" || String(req.headers["accept-language"] || "").toLowerCase().startsWith("ar") ? "ar" : "en";

  if (!q || typeof q !== "string") {
    res.status(400).json({ message: "Search query is required", status: 400 });
    return;
  }

  const products = await dbAll<ProductRow>(
    "SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC",
    [`%${q}%`, `%${q}%`],
  );
  res.json(products.map((p) => formatProduct(p, language)));
});

// ── GET /api/products/:id ──────────────────────────────────────────────────
productsRouterMySQL.get("/:id", async (req, res: Response) => {
  const { id } = req.params;
  const language = req.query.lang === "ar" || String(req.headers["accept-language"] || "").toLowerCase().startsWith("ar") ? "ar" : "en";

  const product = await dbGet<ProductRow>("SELECT * FROM products WHERE id = ?", [id]);
  if (!product) {
    res.status(404).json({ message: "Product not found", status: 404 });
    return;
  }

  const gallery = await dbGet<{ main_image: string; thumbnails: string | null }>(
    "SELECT main_image, thumbnails FROM product_gallery WHERE product_id = ?", [id],
  );
  const sizes = await dbAll<{ name: string; price: number }>(
    "SELECT name, price FROM product_sizes WHERE product_id = ?", [id],
  );

  const thumbnails = gallery?.thumbnails ? JSON.parse(gallery.thumbnails) : [];

  res.json({
    ...formatProduct(product, language),
    gallery: {
      mainImage:  gallery?.main_image || product.image,
      thumbnails: thumbnails.length > 0 ? thumbnails : [product.image],
    },
    sizes: sizes.length > 0 ? sizes : undefined,
  });
});
