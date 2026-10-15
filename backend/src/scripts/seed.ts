import "dotenv/config";
import { initializeDatabase, db } from "../database/init.js";
import { generateId, generateSlug } from "../utils/id.js";
import { hashPassword } from "../utils/password.js";

/**
 * Seed database with initial data
 */
async function seed(): Promise<void> {
  console.log("🌱 Starting database seed...");

  // Initialize database
  initializeDatabase();

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Clearing existing data...");
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM wishlist_items;
    DELETE FROM product_sizes;
    DELETE FROM product_gallery;
    DELETE FROM products;
    DELETE FROM occasions;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // Create test user
  console.log("👤 Creating test user...");
  const userId = generateId();
  const passwordHash = await hashPassword("password123");
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, "test@example.com", "Test User", passwordHash, "customer");

  // Create admin user
  console.log("👑 Creating admin user...");
  const adminId = generateId();
  const adminPasswordHash = await hashPassword("admin123");
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
  ).run(adminId, "admin@wardity.com", "Admin User", adminPasswordHash, "admin");

  // Create categories
  console.log("📁 Creating categories...");
  const categories = [
    { name: "Flowers", imageType: "flower", bgColor: "#FFE5E5" },
    { name: "Gifts", imageType: "gift", bgColor: "#E5F3FF" },
    { name: "Cakes", imageType: "cake", bgColor: "#FFF5E5" },
    { name: "Chocolates", imageType: "chocolate", bgColor: "#E5FFE5" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const id = generateId();
    const slug = generateSlug(cat.name);
    db.prepare(
      "INSERT INTO categories (id, name, slug, image_type, bg_color) VALUES (?, ?, ?, ?, ?)"
    ).run(id, cat.name, slug, cat.imageType, cat.bgColor);
    categoryIds[cat.name] = id;
  }

  // Create occasions
  console.log("🎉 Creating occasions...");
  const occasions = [
    { name: "Birthday", imageType: "birthday" },
    { name: "Anniversary", imageType: "anniversary" },
    { name: "Valentine's Day", imageType: "valentine" },
    { name: "Wedding", imageType: "wedding" },
  ];

  const occasionIds: Record<string, string> = {};
  for (const occ of occasions) {
    const id = generateId();
    const slug = generateSlug(occ.name);
    db.prepare(
      "INSERT INTO occasions (id, name, slug, image_type) VALUES (?, ?, ?, ?)"
    ).run(id, occ.name, slug, occ.imageType);
    occasionIds[occ.name] = id;
  }

  // Create products
  console.log("🛍️ Creating products...");
  const products = [
    {
      name: "Red Rose Bouquet",
      price: 49.99,
      badge: "Best Seller",
      image: "https://images.unsplash.com/photo-1518895949257-8f4a8dc89fd0?w=400",
      description: "Beautiful red roses arranged in an elegant bouquet",
      category: "Flowers",
      occasion: "Valentine's Day",
      status: "In stock" as const,
      sku: "ROSE-001",
    },
    {
      name: "Birthday Cake",
      price: 29.99,
      badge: null,
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
      description: "Delicious chocolate birthday cake",
      category: "Cakes",
      occasion: "Birthday",
      status: "In stock" as const,
      sku: "CAKE-001",
    },
    {
      name: "Premium Chocolate Box",
      price: 39.99,
      badge: "New",
      image: "https://images.unsplash.com/photo-1606312619070-d48b4cbc5e59?w=400",
      description: "Assorted premium chocolates in a gift box",
      category: "Chocolates",
      occasion: null,
      status: "In stock" as const,
      sku: "CHOC-001",
    },
    {
      name: "Anniversary Gift Set",
      price: 79.99,
      badge: null,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
      description: "Special gift set for your anniversary",
      category: "Gifts",
      occasion: "Anniversary",
      status: "In stock" as const,
      sku: "GIFT-001",
    },
    {
      name: "White Lily Bouquet",
      price: 44.99,
      badge: null,
      image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400",
      description: "Elegant white lilies for any occasion",
      category: "Flowers",
      occasion: null,
      status: "In stock" as const,
      sku: "LILY-001",
    },
    {
      name: "Wedding Cake",
      price: 199.99,
      badge: "Premium",
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400",
      description: "Beautiful multi-tier wedding cake",
      category: "Cakes",
      occasion: "Wedding",
      status: "In stock" as const,
      sku: "CAKE-002",
    },
  ];

  for (const product of products) {
    const productId = generateId();
    db.prepare(
      "INSERT INTO products (id, name, price, badge, image, description, category_id, occasion_id, status, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      productId,
      product.name,
      product.price,
      product.badge,
      product.image,
      product.description,
      product.category ? categoryIds[product.category] : null,
      product.occasion ? occasionIds[product.occasion] : null,
      product.status,
      product.sku
    );

    // Add product gallery
    const galleryId = generateId();
    const thumbnails = JSON.stringify([
      product.image,
      product.image,
      product.image,
    ]);
    db.prepare(
      "INSERT INTO product_gallery (id, product_id, main_image, thumbnails) VALUES (?, ?, ?, ?)"
    ).run(galleryId, productId, product.image, thumbnails);

    // Add product sizes (for some products)
    if (product.category === "Cakes" || product.category === "Flowers") {
      const sizes = [
        { name: "Small", price: product.price * 0.8 },
        { name: "Medium", price: product.price },
        { name: "Large", price: product.price * 1.3 },
      ];

      for (const size of sizes) {
        const sizeId = generateId();
        db.prepare(
          "INSERT INTO product_sizes (id, product_id, name, price) VALUES (?, ?, ?, ?)"
        ).run(sizeId, productId, size.name, size.price);
      }
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Test credentials:");
  console.log("   Customer Email: test@example.com");
  console.log("   Customer Password: password123");
  console.log("   Admin Email: admin@wardity.com");
  console.log("   Admin Password: admin123");
  console.log("\n🚀 You can now start the server with: npm run dev");
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
