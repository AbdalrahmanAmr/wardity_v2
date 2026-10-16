/**
 * MySQL schema initialisation and idempotent migration runner.
 *
 * Mirrors the intent of database/init.ts (which targets SQLite) but uses
 * MySQL-compatible DDL:
 *   - TEXT  → VARCHAR(36) for UUID primary keys / foreign keys
 *   - datetime('now') defaults → NOW() / CURRENT_TIMESTAMP
 *   - COLLATE NOCASE  → COLLATE utf8mb4_unicode_ci  (set at DB level)
 *   - INSERT OR IGNORE → INSERT IGNORE
 *   - No SQLite pragmas
 *
 * The imported database wardity_import_nofk_20261016 is assumed to already
 * contain the data; this file only ensures the schema is complete and
 * idempotent — it will never drop, truncate, or reseed existing tables.
 */

import { randomUUID } from "crypto";
import {
  dbExec,
  dbGet,
  dbAll,
  dbRun,
  addColumnIfMissing,
} from "./mysql.js";

// ─── Taxonomy seed data ───────────────────────────────────────────────────

type TaxonomyKind = "categories" | "occasions";

const taxonomyTargets: Record<TaxonomyKind, Array<{
  name: string; slug: string; sortOrder: number; imageType: string; bgColor?: string;
}>> = {
  occasions: [
    { name: "New Year",    slug: "new-year",    sortOrder: 1, imageType: "3D_snowman_tree"  },
    { name: "Birthdays",   slug: "birthdays",   sortOrder: 2, imageType: "3D_cake_candles"  },
    { name: "Anniversary", slug: "anniversary", sortOrder: 3, imageType: "3D_balloons"       },
    { name: "Wedding",     slug: "wedding",     sortOrder: 4, imageType: "3D_rings"          },
    { name: "Thank you",   slug: "thank-you",   sortOrder: 5, imageType: "3D_sign"           },
    { name: "Graduation",  slug: "graduation",  sortOrder: 6, imageType: "3D_cap"            },
    { name: "New Born",    slug: "new-born",    sortOrder: 7, imageType: "3D_clouds"         },
  ],
  categories: [
    { name: "Hand Bouquets", slug: "hand-bouquets", sortOrder: 1, imageType: "illustration_bouquet",      bgColor: "#FFF5F7" },
    { name: "Boxes",         slug: "boxes",         sortOrder: 2, imageType: "illustration_box_roses",    bgColor: "#FFF5F7" },
    { name: "Vases",         slug: "vases",         sortOrder: 3, imageType: "illustration_vase_flowers", bgColor: "#FFF5F7" },
    { name: "Plants",        slug: "plants",        sortOrder: 4, imageType: "illustration_potted_plant", bgColor: "#FFF5F7" },
  ],
};

const taxonomyAliases = [
  { kind: "categories", alias: "flowers-bouquets", target: "hand-bouquets" },
  { kind: "categories", alias: "flowers",          target: "hand-bouquets" },
  { kind: "categories", alias: "bouquets",         target: "hand-bouquets" },
  { kind: "occasions",  alias: "birthday",         target: "birthdays"     },
];

// Legacy slug renames used in syncTaxonomy
const legacyRenames: Record<TaxonomyKind, Record<string, string>> = {
  categories: { flowers: "hand-bouquets", "flowers-bouquets": "hand-bouquets", vases: "vases" },
  occasions:  { birthday: "birthdays" },
};

// ─── Taxonomy sync ────────────────────────────────────────────────────────

export async function synchronizeTaxonomyMySQL(kind: TaxonomyKind): Promise<void> {
  const table = kind;
  const productColumn = kind === "categories" ? "category_id" : "occasion_id";
  const report: string[] = [];

  const targetBySlug = new Map(taxonomyTargets[kind].map((t) => [t.slug, t]));

  for (const target of taxonomyTargets[kind]) {
    const existing = await dbGet<{ id: string; name: string; slug: string }>(
      `SELECT id, name, slug FROM \`${table}\` WHERE slug = ?`, [target.slug],
    );

    if (!existing) {
      // Try to find a legacy row to rename
      const legacySlug = Object.entries(legacyRenames[kind])
        .find(([, targetSlug]) => targetSlug === target.slug)?.[0];
      const legacy = legacySlug
        ? await dbGet<{ id: string; name: string; slug: string }>(
            `SELECT id, name, slug FROM \`${table}\` WHERE slug = ?`, [legacySlug],
          )
        : undefined;

      if (legacy) {
        if (kind === "categories") {
          await dbRun(
            `UPDATE \`${table}\` SET name = ?, slug = ?, sort_order = ?, is_active = 1,
              image_type = ?, bg_color = COALESCE(bg_color, ?) WHERE id = ?`,
            [target.name, target.slug, target.sortOrder, target.imageType, target.bgColor ?? null, legacy.id],
          );
        } else {
          await dbRun(
            `UPDATE \`${table}\` SET name = ?, slug = ?, sort_order = ?, is_active = 1, image_type = ? WHERE id = ?`,
            [target.name, target.slug, target.sortOrder, target.imageType, legacy.id],
          );
        }
        report.push(`RENAMED ${kind.slice(0, -1)} '${legacy.name}' (${legacy.slug}) -> '${target.name}' (${target.slug}); preserved id ${legacy.id}`);
      } else {
        const id = randomUUID();
        if (kind === "categories") {
          await dbRun(
            `INSERT INTO \`${table}\` (id, name, slug, image_type, bg_color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [id, target.name, target.slug, target.imageType, target.bgColor ?? null, target.sortOrder],
          );
        } else {
          await dbRun(
            `INSERT INTO \`${table}\` (id, name, slug, image_type, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [id, target.name, target.slug, target.imageType, target.sortOrder],
          );
        }
        report.push(`CREATED ${kind.slice(0, -1)} '${target.name}' (${target.slug})`);
      }
    } else {
      if (kind === "categories") {
        await dbRun(
          `UPDATE \`${table}\` SET name = ?, sort_order = ?, is_active = 1, image_type = ?, bg_color = ?, slug = ? WHERE id = ?`,
          [target.name, target.sortOrder, target.imageType, target.bgColor ?? null, target.slug, existing.id],
        );
      } else {
        await dbRun(
          `UPDATE \`${table}\` SET name = ?, sort_order = ?, is_active = 1, image_type = ?, slug = ? WHERE id = ?`,
          [target.name, target.sortOrder, target.imageType, target.slug, existing.id],
        );
      }
    }
  }

  // Deactivate / merge rows not in canonical target list
  const activeTargets = new Set(taxonomyTargets[kind].map((t) => t.slug));
  const rows = await dbAll<{ id: string; name: string; slug: string }>(
    `SELECT id, name, slug FROM \`${table}\``,
  );

  for (const row of rows) {
    if (activeTargets.has(row.slug)) continue;
    const replacementSlug = legacyRenames[kind][row.slug];
    if (replacementSlug && targetBySlug.has(replacementSlug)) {
      const replacement = await dbGet<{ id: string }>(
        `SELECT id FROM \`${table}\` WHERE slug = ?`, [replacementSlug],
      );
      if (replacement && replacement.id !== row.id) {
        const affected = await dbAll<{ id: string; name: string }>(
          `SELECT id, name FROM products WHERE ${productColumn} = ?`, [row.id],
        );
        await dbRun(`UPDATE products SET ${productColumn} = ? WHERE ${productColumn} = ?`, [replacement.id, row.id]);
        const result = await dbRun(
          `UPDATE \`${table}\` SET is_active = 0 WHERE id = ? AND is_active != 0`, [row.id],
        );
        if (result.changes > 0) {
          report.push(`MERGED ${kind.slice(0, -1)} '${row.name}' (${row.slug}) into '${replacementSlug}'; reassigned ${affected.length} product(s)`);
        }
      }
      continue;
    }
    const affected = await dbAll<{ id: string; name: string }>(
      `SELECT id, name FROM products WHERE ${productColumn} = ?`, [row.id],
    );
    const result = await dbRun(
      `UPDATE \`${table}\` SET is_active = 0 WHERE id = ? AND is_active != 0`, [row.id],
    );
    if (result.changes > 0) {
      report.push(`HID ${kind.slice(0, -1)} '${row.name}' (${row.slug}); affected ${affected.length} product(s)`);
    }
  }

  // Upsert aliases
  for (const entry of taxonomyAliases.filter((a) => a.kind === kind)) {
    // INSERT IGNORE is MySQL equivalent of INSERT OR IGNORE
    const result = await dbRun(
      `INSERT IGNORE INTO taxonomy_aliases (kind, alias_slug, target_slug) VALUES (?, ?, ?)`,
      [entry.kind, entry.alias, entry.target],
    );
    if (result.changes > 0) report.push(`ALIAS ${entry.alias} -> ${entry.target}`);
  }

  if (report.length > 0) {
    console.log(`📋 Taxonomy sync report (${kind}):\n - ${report.join("\n - ")}`);
  }
}

/**
 * Optional, one-time legacy data conversion. It is deliberately not called
 * from application startup because it changes imported product assignments.
 */
export async function migrateLegacyProductAssignmentsMySQL(): Promise<void> {
  const boxes = await dbGet<{ id: string }>("SELECT id FROM categories WHERE slug = 'boxes'");
  const handBouquet = await dbGet<{ id: string }>("SELECT id FROM categories WHERE slug = 'hand-bouquets'");
  const anniversary = await dbGet<{ id: string }>("SELECT id FROM occasions WHERE slug = 'anniversary'");
  if (boxes) await dbRun("UPDATE products SET category_id = ? WHERE name = 'Premium Chocolate Box' AND category_id != ?", [boxes.id, boxes.id]);
  if (boxes) await dbRun("UPDATE products SET category_id = ? WHERE name = 'Anniversary Gift Set' AND category_id != ?", [boxes.id, boxes.id]);
  await dbRun("UPDATE products SET category_id = NULL WHERE name IN ('Birthday Cake', 'Wedding Cake') AND category_id IS NOT NULL");
  if (handBouquet && anniversary) {
    await dbRun(
      "UPDATE products SET category_id = ?, occasion_id = ? WHERE name = 'Red Rose Bouquet' AND (category_id != ? OR occasion_id != ?)",
      [handBouquet.id, anniversary.id, handBouquet.id, anniversary.id],
    );
  }
}

// ─── Schema initialisation ────────────────────────────────────────────────

export async function initializeDatabaseMySQL(): Promise<void> {
  // ── users ─────────────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS users (
      id           VARCHAR(36)  NOT NULL PRIMARY KEY,
      email        VARCHAR(255) NOT NULL UNIQUE,
      name         VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone        VARCHAR(50),
      role         VARCHAR(50)  NOT NULL DEFAULT 'customer',
      created_at   DATETIME     NOT NULL DEFAULT NOW(),
      updated_at   DATETIME     NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  await addColumnIfMissing("users", "role", "VARCHAR(50) NOT NULL DEFAULT 'customer'");

  // ── categories ────────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         VARCHAR(36)  NOT NULL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      slug       VARCHAR(255) NOT NULL UNIQUE,
      image_type VARCHAR(255),
      bg_color   VARCHAR(50),
      created_at DATETIME     NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  await addColumnIfMissing("categories", "sort_order", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("categories", "is_active",  "TINYINT NOT NULL DEFAULT 1");
  await addColumnIfMissing("categories", "image",      "TEXT");
  await addColumnIfMissing("categories", "name_ar",    "VARCHAR(255)");

  // ── occasions ─────────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS occasions (
      id         VARCHAR(36)  NOT NULL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      slug       VARCHAR(255) NOT NULL UNIQUE,
      image_type VARCHAR(255),
      created_at DATETIME     NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  await addColumnIfMissing("occasions", "sort_order", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("occasions", "is_active",  "TINYINT NOT NULL DEFAULT 1");
  await addColumnIfMissing("occasions", "image",      "TEXT");
  await addColumnIfMissing("occasions", "name_ar",    "VARCHAR(255)");

  // ── products ──────────────────────────────────────────────────────────
  // NOTE: FKs to categories/occasions are omitted here because the imported
  // database (wardity_import_nofk_20261016) may have orphan references.
  // Add them manually after verifying referential integrity.
  await dbExec(`
    CREATE TABLE IF NOT EXISTS products (
      id             VARCHAR(36)  NOT NULL PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      price          DECIMAL(10,2) NOT NULL,
      badge          VARCHAR(100),
      image          TEXT         NOT NULL,
      image_desc     TEXT,
      brand_logo     TEXT,
      status         VARCHAR(50)  DEFAULT 'In stock',
      sku            VARCHAR(100) UNIQUE,
      description    TEXT,
      category_id    VARCHAR(36),
      occasion_id    VARCHAR(36),
      created_at     DATETIME     NOT NULL DEFAULT NOW(),
      updated_at     DATETIME     NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // Column migrations
  await addColumnIfMissing("products", "name_ar",        "TEXT");
  await addColumnIfMissing("products", "description_ar", "TEXT");
  await addColumnIfMissing("products", "sale_price",     "DECIMAL(10,2)");
  await addColumnIfMissing("products", "is_on_sale",     "TINYINT NOT NULL DEFAULT 0");
  await addColumnIfMissing("products", "sale_ends_at",   "DATETIME");
  await addColumnIfMissing("products", "stock_quantity", "INT");

  // ── taxonomy_aliases ──────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS taxonomy_aliases (
      kind        VARCHAR(50)  NOT NULL,
      alias_slug  VARCHAR(255) NOT NULL,
      target_slug VARCHAR(255) NOT NULL,
      PRIMARY KEY (kind, alias_slug)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── product_gallery ───────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS product_gallery (
      id          VARCHAR(36) NOT NULL PRIMARY KEY,
      product_id  VARCHAR(36) NOT NULL,
      main_image  TEXT        NOT NULL,
      thumbnails  LONGTEXT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── product_sizes ─────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS product_sizes (
      id         VARCHAR(36)   NOT NULL PRIMARY KEY,
      product_id VARCHAR(36)   NOT NULL,
      name       VARCHAR(255)  NOT NULL,
      price      DECIMAL(10,2) NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── cart_items ────────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id            VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id       VARCHAR(36) NOT NULL,
      product_id    VARCHAR(36) NOT NULL,
      quantity      INT         NOT NULL DEFAULT 1,
      selected_size VARCHAR(100),
      created_at    DATETIME    NOT NULL DEFAULT NOW(),
      updated_at    DATETIME    NOT NULL DEFAULT NOW(),
      UNIQUE KEY uq_cart (user_id, product_id, selected_size)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── wishlist_items ────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id         VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id    VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      created_at DATETIME    NOT NULL DEFAULT NOW(),
      UNIQUE KEY uq_wishlist (user_id, product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── orders ────────────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS orders (
      id               VARCHAR(36)   NOT NULL PRIMARY KEY,
      user_id          VARCHAR(36)   NOT NULL,
      status           VARCHAR(50)   NOT NULL DEFAULT 'pending',
      total            DECIMAL(10,2) NOT NULL,
      shipping_address TEXT          NOT NULL,
      payment_method   VARCHAR(100),
      event_id         VARCHAR(255),
      created_at       DATETIME      NOT NULL DEFAULT NOW(),
      updated_at       DATETIME      NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  await addColumnIfMissing("orders", "event_id", "VARCHAR(255)");

  // ── order_items ───────────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id            VARCHAR(36)   NOT NULL PRIMARY KEY,
      order_id      VARCHAR(36)   NOT NULL,
      product_id    VARCHAR(36)   NOT NULL,
      quantity      INT           NOT NULL,
      price         DECIMAL(10,2) NOT NULL,
      selected_size VARCHAR(100)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── homepage_carousel ─────────────────────────────────────────────────
  await dbExec(`
    CREATE TABLE IF NOT EXISTS homepage_carousel (
      id             VARCHAR(36)  NOT NULL PRIMARY KEY,
      image          TEXT         NOT NULL,
      headline       VARCHAR(500) NOT NULL,
      headline_ar    VARCHAR(500),
      sub_headline   VARCHAR(500),
      sub_headline_ar VARCHAR(500),
      cta_text       VARCHAR(255) NOT NULL,
      cta_text_ar    VARCHAR(255),
      cta_link       VARCHAR(500) NOT NULL,
      sort_order     INT          NOT NULL DEFAULT 0,
      is_visible     TINYINT      NOT NULL DEFAULT 1,
      created_at     DATETIME     NOT NULL DEFAULT NOW(),
      updated_at     DATETIME     NOT NULL DEFAULT NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  // ── Indexes ───────────────────────────────────────────────────────────
  // CREATE INDEX IF NOT EXISTS is not supported in MySQL < 8.0.
  // Use the INFORMATION_SCHEMA approach instead.
  const indexDefs: Array<{ name: string; table: string; column: string }> = [
    { name: "idx_products_category",   table: "products",       column: "category_id" },
    { name: "idx_products_occasion",   table: "products",       column: "occasion_id" },
    { name: "idx_cart_items_user",     table: "cart_items",     column: "user_id"     },
    { name: "idx_wishlist_items_user", table: "wishlist_items", column: "user_id"     },
    { name: "idx_orders_user",         table: "orders",         column: "user_id"     },
  ];
  const dbName = process.env.MYSQL_DATABASE!;
  for (const idx of indexDefs) {
    const exists = await dbGet<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND SEQ_IN_INDEX = 1`,
      [dbName, idx.table, idx.column],
    );
    if ((exists?.cnt ?? 0) === 0) {
      await dbExec(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\` (\`${idx.column}\`)`);
      console.log(`🛠️  Index created: ${idx.name}`);
    }
  }

  console.log("✅ MySQL database initialised successfully");
}
