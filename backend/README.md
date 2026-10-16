# Wardity Backend API

Backend API server for the Wardity e-commerce platform built with Node.js, Express, TypeScript, and MySQL.

## Features

- 🔐 JWT-based authentication
- 🛍️ Product management with categories and occasions
- 🛒 Shopping cart functionality
- ❤️ Wishlist management
- 📦 Order processing
- 🔍 Product search and filtering
- 📄 Pagination support
- ✅ Input validation with Zod
- 🛡️ Error handling middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL (with mysql2)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (optional):
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-local-password
MYSQL_DATABASE=wardity_import_nofk_20261016
CORS_ORIGIN=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PATCH /api/auth/profile` - Update user profile (requires auth)

### Products

- `GET /api/products` - Get all products (supports pagination, filtering)
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:id` - Get product by ID

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category by slug

### Occasions

- `GET /api/occasions` - Get all occasions
- `GET /api/occasions/:slug` - Get occasion by slug

### Cart (Requires Authentication)

- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Wishlist (Requires Authentication)

- `GET /api/wishlist` - Get user's wishlist
- `GET /api/wishlist/check/:productId` - Check if product is in wishlist
- `POST /api/wishlist/items` - Add product to wishlist
- `DELETE /api/wishlist/items/:productId` - Remove product from wishlist

### Orders (Requires Authentication)

- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order from cart

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `products` - Product catalog
- `categories` - Product categories
- `occasions` - Special occasions
- `cart_items` - Shopping cart items
- `wishlist_items` - User wishlists
- `orders` - Customer orders
- `order_items` - Order line items
- `product_gallery` - Product images
- `product_sizes` - Product size variants

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with initial data
- `npm run typecheck` - Type check without building

### Project Structure

```
backend/
├── src/
│   ├── database/       # Database initialization
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route handlers
│   ├── scripts/        # Utility scripts (seed, etc.)
│   ├── utils/          # Helper functions
│   └── index.ts        # Application entry point
├── dist/               # Compiled JavaScript (gitignored)
└── package.json
```

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Set environment variables in production

3. Start the server:
```bash
npm start
```

## Notes

- The backend requires MySQL and does not create or seed catalog data during startup
- JWT tokens expire after 7 days by default (configurable via `JWT_EXPIRES_IN`)
- CORS is configured to allow requests from the frontend origin

## License

ISC
