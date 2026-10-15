import Database, { Database as DatabaseType } from "better-sqlite3";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = resolve(__dirname, "../..");
export const DB_PATH = resolve(
  backendDir,
  process.env.DATABASE_PATH || "data/wardity.db",
);

// Ensure data directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const db: DatabaseType = new Database(DB_PATH);
db.pragma("journal_mode = WAL"); // Write-Ahead Logging for better concurrency

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: Add role column if it doesn't exist
  const usersTableInfo = db.pragma("table_info('users')") as Array<{ name: string }>;
  const hasRoleColumn = usersTableInfo.some((col) => col.name === "role");
  if (!hasRoleColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'`);
    console.log("🛠️ Migration: Added 'role' column to users table");
  }

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_type TEXT,
      bg_color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Occasions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS occasions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      badge TEXT,
      image TEXT NOT NULL,
      image_desc TEXT,
      brand_logo TEXT,
      status TEXT DEFAULT 'In stock',
      sku TEXT UNIQUE,
      description TEXT,
      category_id TEXT,
      occasion_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (occasion_id) REFERENCES occasions(id)
    )
  `);

  const productsTableInfo = db.pragma("table_info('products')") as Array<{ name: string }>;
  const productColumns = new Set(productsTableInfo.map((column) => column.name));
  const migrations: Array<[string, string]> = [
    ["sale_price", "ALTER TABLE products ADD COLUMN sale_price REAL"],
    ["is_on_sale", "ALTER TABLE products ADD COLUMN is_on_sale INTEGER NOT NULL DEFAULT 0"],
    ["sale_ends_at", "ALTER TABLE products ADD COLUMN sale_ends_at TEXT"],
    ["stock_quantity", "ALTER TABLE products ADD COLUMN stock_quantity INTEGER"],
  ];
  for (const [column, statement] of migrations) {
    if (!productColumns.has(column)) {
      db.exec(statement);
      console.log(`🛠️ Migration: Added '${column}' column to products table`);
    }
  }
  db.exec("UPDATE products SET is_on_sale = 0 WHERE is_on_sale IS NULL");

  // Product gallery table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_gallery (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      main_image TEXT NOT NULL,
      thumbnails TEXT, -- JSON array of thumbnail URLs
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Product sizes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_sizes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Cart items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_size TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id, selected_size)
    )
  `);

  // Wishlist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const ordersTableInfo = db.pragma("table_info('orders')") as Array<{ name: string }>;
  if (!ordersTableInfo.some((column) => column.name === "event_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN event_id TEXT");
    console.log("🛠️ Migration: Added 'event_id' column to orders table");
  }

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      selected_size TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_occasion ON products(occasion_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);

  console.log("✅ Database initialized successfully");
}
