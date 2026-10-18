import "dotenv/config";
import express from "express";
import cors from "cors";
import "express-async-errors";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { trackingRouter } from "./routes/tracking.js";
import { settingsRouter } from "./routes/settings.js";
import { newsletterRouter } from "./routes/newsletter.js";
import { deliveryLocationsRouter } from "./routes/delivery-locations.js";
import { UPLOADS_DIR } from "./utils/uploads.js";
import { validateJwtSecret } from "./utils/jwt.js";
import { runtimeConfig } from "./config/runtime.js";
import { mkdirSync } from "fs";

// ── Database driver selection ──────────────────────────────────────────────
if (runtimeConfig.databaseDriver !== "mysql") {
  throw new Error("DB_DRIVER must be set to mysql");
}

const app  = express();
const configuredOrigins = runtimeConfig.corsOrigins;
const isDevelopment = runtimeConfig.nodeEnv !== "production";

async function bootstrap() {
  validateJwtSecret();

  // ── Initialise database ──────────────────────────────────────────────────
  const { initMySQL }               = await import("./database/mysql.js");
  const { initializeDatabaseMySQL } = await import("./database/init-mysql.js");
  await initMySQL();
  await initializeDatabaseMySQL();
  console.log("🗄️  Database driver: MySQL");

  mkdirSync(UPLOADS_DIR, { recursive: true });

  // ── Middleware ─────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        const isAllowedDev =
          isDevelopment &&
          !!origin &&
          runtimeConfig.developmentCorsOrigins.includes(origin);
        if (!origin || configuredOrigins.includes(origin) || isAllowedDev) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: runtimeConfig.requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: runtimeConfig.requestBodyLimit }));
  app.use("/api/track", trackingRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/newsletter", newsletterRouter);
  app.use("/api/delivery-locations", deliveryLocationsRouter);
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  // ── Health check ───────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", driver: runtimeConfig.databaseDriver, timestamp: new Date().toISOString() });
  });

  const { authRouterMySQL }       = await import("./routes/auth-mysql.js");
  const { productsRouterMySQL }   = await import("./routes/products-mysql.js");
  const { categoriesRouterMySQL, occasionsRouterMySQL,
          wishlistRouterMySQL, carouselRouterMySQL } = await import("./routes/simple-mysql.js");
  const { cartRouterMySQL }       = await import("./routes/cart-mysql.js");
  const { ordersRouterMySQL }     = await import("./routes/orders-mysql.js");
  const { adminRouterMySQL }      = await import("./routes/admin-mysql.js");

  app.use("/api/auth",       authRouterMySQL);
  app.use("/api/products",   productsRouterMySQL);
  app.use("/api/categories", categoriesRouterMySQL);
  app.use("/api/occasions",  occasionsRouterMySQL);
  app.use("/api/carousel",   carouselRouterMySQL);
  app.use("/api/cart",       cartRouterMySQL);
  app.use("/api/wishlist",   wishlistRouterMySQL);
  app.use("/api/orders",     ordersRouterMySQL);
  app.use("/api/admin",      adminRouterMySQL);

  // ── Error handling ─────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(runtimeConfig.port, () => {
    console.log(`🚀 Server listening on port ${runtimeConfig.port}`);
    console.log(`📊 Health check: /health`);
    console.log(`📁 Uploads: ${UPLOADS_DIR}`);
  });
}

bootstrap().catch((err) => {
  console.error("💥 Failed to start server:", err);
  process.exit(1);
});
