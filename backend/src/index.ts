import "dotenv/config";
import express from "express";
import cors from "cors";
import "express-async-errors";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { categoriesRouter } from "./routes/categories.js";
import { occasionsRouter } from "./routes/occasions.js";
import { cartRouter } from "./routes/cart.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import { trackingRouter } from "./routes/tracking.js";
import { DB_PATH, initializeDatabase } from "./database/init.js";
import { UPLOADS_DIR } from "./utils/uploads.js";
import { mkdirSync } from "fs";

const app = express();
const PORT = process.env.PORT || 3001;
const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isDevelopment = process.env.NODE_ENV !== "production";

// Initialize database
initializeDatabase();
mkdirSync(UPLOADS_DIR, { recursive: true });

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowedDevelopmentOrigin =
        isDevelopment &&
        !!origin &&
        /^http:\/\/localhost:51(7[3-9]|80)$/.test(origin);
      if (!origin || configuredOrigins.includes(origin) || isAllowedDevelopmentOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/track", trackingRouter);
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

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/occasions", occasionsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️ Database: ${DB_PATH}`);
  console.log(`📁 Uploads: ${UPLOADS_DIR}`);
});
