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
import {
  getEffectiveSale,
  effectiveStatus,
  ProductSaleFields,
} from "../utils/productPricing.js";
import { dbGet, dbAll } from "../database/mysql.js";
import type { ExecuteValues } from "mysql2/promise";

export const productsRouterMySQL = Router();

type ProductRow = ProductSaleFields & Record<string, unknown>;

function formatProduct(product: ProductRow, language = "en") {
  const sale = getEffectiveSale(product);
  return {
    id: product.id,
    name: language === "ar" && product.name_ar ? product.name_ar : product.name,
    price: product.price,
    salePrice: sale.salePrice,
    isOnSale: sale.isOnSale,
    discountPercent: sale.discountPercent,
    saleEndsAt: product.sale_ends_at,
    stockQuantity: product.stock_quantity,
    badge: product.badge,
    image: product.image,
    imageDesc: product.image_desc,
    brandLogo: product.brand_logo,
    status: effectiveStatus(product),
    sku: product.sku,
    nameAr: product.name_ar,
    description:
      language === "ar" && product.description_ar
        ? product.description_ar
        : product.description,
    descriptionAr: product.description_ar,
    categoryId: product.category_id,
    occasionId: product.occasion_id,
  };
}

// ── GET /api/products ──────────────────────────────────────────────────────
productsRouterMySQL.get("/", async (req, res: Response) => {
  const {
    page = "1",
    pageSize = "20",
    category,
    occasion,
    search,
    minPrice,
    maxPrice,
    status,
    badge,
    bestSeller,
  } = req.query;
  const language =
    req.query.lang === "ar" ||
    String(req.headers["accept-language"] || "")
      .toLowerCase()
      .startsWith("ar")
      ? "ar"
      : "en";

  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  let query = "SELECT * FROM products WHERE 1=1";
  const params: ExecuteValues[] = [];

  if (typeof category === "string") {
    const alias = await dbGet<{ target_slug: string }>(
      "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'categories' AND alias_slug = ?",
      [category],
    );
    const resolvedCategory = alias?.target_slug || category;
    // MySQL with utf8mb4_unicode_ci is already case-insensitive — no COLLATE NOCASE needed
    query +=
      " AND (category_id = ? OR category_id IN (SELECT id FROM categories WHERE name = ? OR slug = ?))";
    params.push(resolvedCategory, resolvedCategory, resolvedCategory);
  }

  if (typeof occasion === "string") {
    const alias = await dbGet<{ target_slug: string }>(
      "SELECT target_slug FROM taxonomy_aliases WHERE kind = 'occasions' AND alias_slug = ?",
      [occasion],
    );
    const resolvedOccasion = alias?.target_slug || occasion;
    query +=
      " AND (occasion_id = ? OR occasion_id IN (SELECT id FROM occasions WHERE name = ? OR slug = ?))";
    params.push(resolvedOccasion, resolvedOccasion, resolvedOccasion);
  }

  if (typeof badge === "string") {
    query += " AND LOWER(TRIM(COALESCE(badge, ''))) = ?";
    params.push(badge.trim().toLowerCase());
  } else if (bestSeller === "true") {
    query += " AND LOWER(TRIM(COALESCE(badge, ''))) = 'best seller'";
  }

  if (typeof search === "string") {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  if (typeof minPrice === "string") {
    query += " AND price >= ?";
    params.push(parseFloat(minPrice));
  }
  if (typeof maxPrice === "string") {
    query += " AND price <= ?";
    params.push(parseFloat(maxPrice));
  }
  if (typeof status === "string") {
    query += " AND status = ?";
    params.push(status);
  }

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

  res.json({
    data: formattedProducts,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages,
  });
});

// ── GET /api/products/search ───────────────────────────────────────────────
productsRouterMySQL.get("/search", async (req, res: Response) => {
  if (req.query.q !== undefined && typeof req.query.q !== "string") {
    res
      .status(400)
      .json({ message: "Search query must be a single text value." });
    return;
  }
  const q = (req.query.q || "").trim();
  if (q.length > 100) {
    res
      .status(400)
      .json({ message: "Search query must be 100 characters or fewer." });
    return;
  }

  const categoryId = req.query.categoryId;
  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(categoryId))
  ) {
    res.status(400).json({ message: "Invalid category filter." });
    return;
  }

  const minPriceRaw = req.query.minPrice;
  const maxPriceRaw = req.query.maxPrice;
  const parsePrice = (value: unknown): number | null | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value))
      return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const minPrice = parsePrice(minPriceRaw);
  const maxPrice = parsePrice(maxPriceRaw);
  if (
    minPrice === null ||
    maxPrice === null ||
    (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
  ) {
    res.status(400).json({ message: "Enter a valid price range." });
    return;
  }

  const availability = req.query.availability;
  if (
    availability !== undefined &&
    (typeof availability !== "string" ||
      !["in-stock", "out-of-stock"].includes(availability))
  ) {
    res.status(400).json({ message: "Invalid availability filter." });
    return;
  }
  const onSale = req.query.onSale;
  if (onSale !== undefined && onSale !== "true" && onSale !== "false") {
    res.status(400).json({ message: "Invalid sale filter." });
    return;
  }
  const sortBy = req.query.sortBy ?? "relevance";
  if (
    typeof sortBy !== "string" ||
    !["relevance", "price-asc", "price-desc", "newest"].includes(sortBy)
  ) {
    res.status(400).json({ message: "Invalid sort order." });
    return;
  }

  const language =
    req.query.lang === "ar" ||
    String(req.headers["accept-language"] || "")
      .toLowerCase()
      .startsWith("ar")
      ? "ar"
      : "en";

  if (q.length === 1) {
    res.json([]);
    return;
  }

  const effectivePriceSql =
    "CASE WHEN is_on_sale = 1 AND sale_price IS NOT NULL AND sale_price < price AND (sale_ends_at IS NULL OR sale_ends_at > NOW()) THEN sale_price ELSE price END";
  const conditions: string[] = [];
  const params: ExecuteValues[] = [];

  if (q.length >= 2) {
    const safePattern = q.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
    const likePattern = `%${safePattern}%`;
    conditions.push(`(name LIKE ? ESCAPE '\\\\'
      OR name_ar LIKE ? ESCAPE '\\\\'
      OR description LIKE ? ESCAPE '\\\\'
      OR description_ar LIKE ? ESCAPE '\\\\'
      OR sku LIKE ? ESCAPE '\\\\')`);
    params.push(
      likePattern,
      likePattern,
      likePattern,
      likePattern,
      likePattern,
    );
  }

  if (categoryId) {
    conditions.push("category_id = ?");
    params.push(categoryId);
  }
  if (minPrice !== undefined) {
    conditions.push(`${effectivePriceSql} >= ?`);
    params.push(minPrice);
  }
  if (maxPrice !== undefined) {
    conditions.push(`${effectivePriceSql} <= ?`);
    params.push(maxPrice);
  }
  if (availability === "in-stock") {
    conditions.push(
      "status = 'In stock' AND (stock_quantity IS NULL OR stock_quantity > 0)",
    );
  } else if (availability === "out-of-stock") {
    conditions.push("(status = 'Out of stock' OR stock_quantity = 0)");
  }
  if (onSale === "true") {
    conditions.push(
      "is_on_sale = 1 AND sale_price IS NOT NULL AND sale_price < price AND (sale_ends_at IS NULL OR sale_ends_at > NOW())",
    );
  }

  if (conditions.length === 0) {
    res.json([]);
    return;
  }

  const relevanceOrder =
    q.length >= 2
      ? `CASE
         WHEN name = ? THEN 100
         WHEN name_ar = ? THEN 100
         WHEN sku = ? THEN 90
         WHEN name LIKE ? ESCAPE '\\\\' THEN 80
         WHEN name_ar LIKE ? ESCAPE '\\\\' THEN 80
         WHEN sku LIKE ? ESCAPE '\\\\' THEN 70
         WHEN description LIKE ? ESCAPE '\\\\' THEN 60
         WHEN description_ar LIKE ? ESCAPE '\\\\' THEN 60
         ELSE 10
       END DESC, created_at DESC`
      : "created_at DESC";
  const sortOrder: Record<string, string> = {
    relevance: relevanceOrder,
    "price-asc": `${effectivePriceSql} ASC, created_at DESC`,
    "price-desc": `${effectivePriceSql} DESC, created_at DESC`,
    newest: "created_at DESC",
  };
  const orderingParams: ExecuteValues[] =
    sortBy === "relevance" && q.length >= 2
      ? [
          q,
          q,
          q,
          ...Array.from(
            { length: 5 },
            () => `%${q.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")}%`,
          ),
        ]
      : [];
  params.push(...orderingParams);

  const products = await dbAll<ProductRow>(
    `SELECT id, name, name_ar, price, sale_price, is_on_sale, sale_ends_at,
            stock_quantity, badge, image, brand_logo, status, sku, category_id
       FROM products
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${sortOrder[sortBy]}
      LIMIT 50`,
    params,
  );

  res.json(products.map((p) => formatProduct(p, language)));
});

// ── GET /api/products/:id ──────────────────────────────────────────────────
productsRouterMySQL.get("/:id", async (req, res: Response) => {
  const { id } = req.params;
  const language =
    req.query.lang === "ar" ||
    String(req.headers["accept-language"] || "")
      .toLowerCase()
      .startsWith("ar")
      ? "ar"
      : "en";

  const product = await dbGet<ProductRow>(
    "SELECT * FROM products WHERE id = ?",
    [id],
  );
  if (!product) {
    res.status(404).json({ message: "Product not found", status: 404 });
    return;
  }

  const gallery = await dbGet<{
    main_image: string;
    thumbnails: string | null;
  }>(
    "SELECT main_image, thumbnails FROM product_gallery WHERE product_id = ?",
    [id],
  );
  const sizes = await dbAll<{ name: string; price: number }>(
    "SELECT name, price FROM product_sizes WHERE product_id = ?",
    [id],
  );

  const thumbnails = gallery?.thumbnails ? JSON.parse(gallery.thumbnails) : [];

  res.json({
    ...formatProduct(product, language),
    gallery: {
      mainImage: gallery?.main_image || product.image,
      thumbnails: thumbnails.length > 0 ? thumbnails : [product.image],
    },
    sizes: sizes.length > 0 ? sizes : undefined,
  });
});
