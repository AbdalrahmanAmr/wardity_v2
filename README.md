# 🛍️ Wardity

> A modern, full-stack e-commerce platform built with React 19, TypeScript, and Express. Featuring product browsing, shopping cart, wishlist, order management, and more.

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF?logo=vite)](https://vitejs.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5.90.6-FF4154?logo=reactquery)](https://tanstack.com/query)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Code Standards](#-code-standards)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 🛒 E-Commerce Core

- **Product Catalog**: Browse products by category, brand, occasion, and collections
- **Product Details**: Comprehensive product pages with images, descriptions, and reviews
- **Search & Filters**: Advanced search with filtering capabilities
- **Shopping Cart**: Add, remove, and manage items in cart
- **Wishlist**: Save favorite products for later
- **Checkout**: Secure checkout process with order management

### 👤 User Features

- **Authentication**: User registration and login with JWT
- **User Profile**: Manage account settings and preferences
- **Order Tracking**: Track order status and delivery
- **Order History**: View past orders and receipts

### 🎨 UI/UX

- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode**: Toggle between light and dark themes
- **Multi-language Support**: Internationalization ready
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages and boundaries
- **SEO Optimized**: Meta tags and semantic HTML

### 🚀 Performance

- **Data Prefetching**: Route loaders for faster page loads
- **Query Caching**: Intelligent caching with TanStack Query
- **Code Splitting**: Lazy loading for optimal bundle size
- **Optimistic Updates**: Instant UI feedback

---

## 🚀 Tech Stack

### Frontend

| Technology               | Version | Purpose                 |
| ------------------------ | ------- | ----------------------- |
| **React**                | 19.2.0  | UI framework            |
| **TypeScript**           | 5.9.3   | Type safety             |
| **Vite**                 | 7.1.12  | Build tool & dev server |
| **TanStack React Query** | 5.90.6  | Server state management |
| **React Router**         | 7.9.5   | Client-side routing     |
| **Tailwind CSS**         | 3.4.13  | Utility-first CSS       |
| **DaisyUI**              | 5.3.7   | Component library       |
| **Material Tailwind**    | 2.1.10  | Additional components   |
| **Heroicons**            | 2.2.0   | Icon library            |

### Backend

| Technology                  | Version | Purpose               |
| --------------------------- | ------- | --------------------- |
| **Express**                 | 4.18.2  | Web framework         |
| **TypeScript**              | 5.3.3   | Type safety           |
| **SQLite** (better-sqlite3) | 9.2.2   | Database              |
| **JWT** (jsonwebtoken)      | 9.0.2   | Authentication        |
| **bcryptjs**                | 2.4.3   | Password hashing      |
| **Zod**                     | 3.22.4  | Schema validation     |
| **CORS**                    | 2.8.5   | Cross-origin requests |

### Development Tools

- **ESLint**: 9.36.0 - Code linting
- **TypeScript ESLint**: 8.46.2 - TypeScript-specific linting
- **React Hooks ESLint**: 5.2.0 - React hooks validation
- **PostCSS**: 8.5.6 - CSS processing
- **Autoprefixer**: 10.4.21 - CSS vendor prefixes

---

## 📁 Project Structure

```
Wardity/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── database/          # Database initialization
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts        # JWT authentication
│   │   │   ├── errorHandler.ts
│   │   │   └── notFoundHandler.ts
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── products.ts    # Product endpoints
│   │   │   ├── categories.ts  # Category endpoints
│   │   │   ├── cart.ts        # Cart endpoints
│   │   │   ├── wishlist.ts    # Wishlist endpoints
│   │   │   ├── orders.ts      # Order endpoints
│   │   │   └── occasions.ts   # Occasion endpoints
│   │   └── utils/             # Utility functions
│   │       ├── jwt.ts         # JWT helpers
│   │       ├── password.ts    # Password hashing
│   │       └── validation.ts  # Validation helpers
│   ├── package.json
│   └── tsconfig.json
│
├── src/                        # Frontend source code
│   ├── assets/                # Static assets (images, fonts)
│   ├── components/            # React components
│   │   ├── features/          # Feature-specific components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── OccasionCard.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   └── ChatWidget.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBlock.tsx
│   │       └── ErrorBoundary.tsx
│   ├── config/                # Configuration
│   │   └── env.ts             # Environment variables
│   ├── constants/             # Application constants
│   │   ├── routes.ts          # Route definitions
│   │   ├── api.ts             # API endpoints
│   │   ├── storage.ts         # LocalStorage keys
│   │   └── pagination.ts      # Pagination defaults
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── CartContext.tsx    # Shopping cart state
│   │   ├── WishlistContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── DeliveryLocationContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useDarkMode.ts
│   ├── layouts/               # Layout components
│   │   └── RootLayout.tsx
│   ├── pages/                 # Route pages
│   │   ├── Home.tsx
│   │   ├── Product.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Profile.tsx
│   │   └── ...
│   ├── router/                # Router configuration
│   │   ├── index.tsx          # Router setup
│   │   └── loaders.ts         # Route loaders
│   ├── services/              # API & data services
│   │   ├── api.ts             # API client
│   │   ├── queryClient.ts     # React Query config
│   │   └── queries/           # React Query hooks
│   │       ├── productQueries.ts
│   │       ├── categoryQueries.ts
│   │       ├── cartQueries.ts
│   │       └── wishlistQueries.ts
│   ├── types/                 # TypeScript types
│   │   ├── api.ts             # API types
│   │   ├── product.ts         # Product types
│   │   ├── category.ts        # Category types
│   │   ├── cart.ts            # Cart types
│   │   └── common.ts          # Common types
│   ├── utils/                 # Utility functions
│   │   ├── formatters.ts      # Data formatting
│   │   └── share.ts           # Share utilities
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
│
├── public/                    # Public static files
├── dist/                      # Production build output
├── package.json               # Frontend dependencies
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Owner setup guides

Contact channel defaults, visibility switches, and channel setup notes are documented in the [Wardity setup guides](./docs/setup/README.md).

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn/pnpm)
- **Git**: For cloning the repository

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/wardity.git
   cd wardity
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Frontend (.env)
   VITE_API_URL=http://localhost:3000/api
   ```

   Create a `.env` file in the `backend/` directory:

   ```env
   # Backend (backend/.env)
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

5. **Initialize the database** (if needed)
   ```bash
   cd backend
   npm run seed  # If seed script exists
   ```

### Running the Application

#### Development Mode

**Terminal 1 - Start Backend:**

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

**Terminal 2 - Start Frontend:**

```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (or the next available port)

#### Production Build

**Build Frontend:**

```bash
npm run build
```

**Build Backend:**

```bash
cd backend
npm run build
```

**Start Production Server:**

```bash
cd backend
npm start
```

**Preview Production Build:**

```bash
npm run preview
```

---

## 💻 Development

### Available Scripts

#### Frontend Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint to check code quality         |

#### Backend Scripts

| Script              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start development server with hot reload (tsx watch) |
| `npm run build`     | Compile TypeScript to JavaScript                     |
| `npm start`         | Start production server                              |
| `npm run seed`      | Seed database with initial data                      |
| `npm run typecheck` | Type check without emitting files                    |

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Follow the code standards below
   - Write clean, type-safe code
   - Add comments for complex logic

3. **Test your changes**

   ```bash
   npm run lint
   npm run build  # Ensure build succeeds
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**

### Code Standards

#### Component Structure

All components follow this structure:

```typescript
import { FC } from "react";
import { useQuery } from "@tanstack/react-query";

interface ComponentProps {
  id: string;
  onUpdate?: (data: DataType) => void;
}

export const Component: FC<ComponentProps> = ({ id, onUpdate }) => {
  // 1. Hooks first (in order: router, query, state, refs, effects)
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResource(id),
  });
  const [isOpen, setIsOpen] = useState(false);

  // 2. Event handlers
  const handleClick = (): void => {
    setIsOpen(true);
  };

  // 3. Conditional renders (early returns)
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBlock error={error} />;

  // 4. Main render
  return <div>{/* component JSX */}</div>;
};
```

#### TypeScript Standards

✅ **ALWAYS:**

- Define interfaces for all props, state, and API responses
- Use explicit return types for functions
- Use `unknown` instead of `any` when type is unclear
- Organize types by domain in separate files

❌ **NEVER:**

- Use `any` type
- Leave implicit types on function parameters
- Skip interface definitions for props

#### Data Fetching

✅ **ALWAYS use TanStack Query:**

- Use `useQuery` for GET requests
- Use `useMutation` for POST/PUT/DELETE requests
- Use query keys factory pattern
- Invalidate queries after mutations

❌ **NEVER:**

- Use `useEffect` + `fetch` for data fetching
- Manually manage loading/error states
- Forget to invalidate queries after mutations

#### Styling

✅ **PRIMARY: Tailwind Utilities**

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">Title</h2>
</div>
```

✅ **SECONDARY: DaisyUI** (when explicitly requested)

```tsx
<button className="btn btn-primary">Click Me</button>
```

❌ **NEVER:**

- Write custom CSS files
- Use inline styles (except dynamic values)
- Use CSS modules

---

## 📡 API Documentation

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

### Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| POST   | `/auth/register` | Register new user | No            |
| POST   | `/auth/login`    | Login user        | No            |
| GET    | `/auth/me`       | Get current user  | Yes           |

#### Products

| Method | Endpoint                         | Description              | Auth Required |
| ------ | -------------------------------- | ------------------------ | ------------- |
| GET    | `/products`                      | Get all products         | No            |
| GET    | `/products/:id`                  | Get product by ID        | No            |
| GET    | `/products/category/:categoryId` | Get products by category | No            |
| GET    | `/products/search?q=query`       | Search products          | No            |

#### Categories

| Method | Endpoint          | Description        | Auth Required |
| ------ | ----------------- | ------------------ | ------------- |
| GET    | `/categories`     | Get all categories | No            |
| GET    | `/categories/:id` | Get category by ID | No            |

#### Cart

| Method | Endpoint        | Description           | Auth Required |
| ------ | --------------- | --------------------- | ------------- |
| GET    | `/cart`         | Get user's cart       | Yes           |
| POST   | `/cart`         | Add item to cart      | Yes           |
| PUT    | `/cart/:itemId` | Update cart item      | Yes           |
| DELETE | `/cart/:itemId` | Remove item from cart | Yes           |

#### Wishlist

| Method | Endpoint            | Description               | Auth Required |
| ------ | ------------------- | ------------------------- | ------------- |
| GET    | `/wishlist`         | Get user's wishlist       | Yes           |
| POST   | `/wishlist`         | Add item to wishlist      | Yes           |
| DELETE | `/wishlist/:itemId` | Remove item from wishlist | Yes           |

#### Orders

| Method | Endpoint            | Description        | Auth Required |
| ------ | ------------------- | ------------------ | ------------- |
| GET    | `/orders`           | Get user's orders  | Yes           |
| GET    | `/orders/:id`       | Get order by ID    | Yes           |
| POST   | `/orders`           | Create new order   | Yes           |
| GET    | `/orders/:id/track` | Track order status | Yes           |

### Example Request

```typescript
// Using the API client
import { api } from "@/services/api";

// Get products
const products = await api.get("/products");

// Add to cart (requires auth)
const cartItem = await api.post("/cart", {
  productId: "prod_123",
  quantity: 2,
});
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Testing Best Practices

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Test component rendering and user interactions
- Test error handling and edge cases
- Aim for >80% code coverage

---

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Set environment variables** in your hosting platform:

   - `VITE_API_URL`: Your backend API URL

3. **Deploy** the `dist/` folder

### Backend Deployment

1. **Build the backend**

   ```bash
   cd backend
   npm run build
   ```

2. **Set environment variables**:

   - `PORT`: Server port
   - `JWT_SECRET`: Strong secret key
   - `NODE_ENV`: `production`

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Contribution Process

1. **Fork the repository**
2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Follow code standards**

   - Use TypeScript strictly
   - Follow component structure guidelines
   - Write meaningful commit messages
   - Keep components under 200 lines

4. **Test your changes**

   - Run `npm run lint`
   - Ensure build succeeds
   - Test manually in browser

5. **Commit your changes**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your branch**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Code Review Checklist

- [ ] Code follows project standards
- [ ] TypeScript types are properly defined
- [ ] No `any` types used
- [ ] Components are properly structured
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Code is tested
- [ ] Documentation is updated

---

## 🔧 Troubleshooting

### Common Issues

#### Frontend won't start

**Issue**: Port already in use

```bash
# Solution: Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill
```

#### Backend connection errors

**Issue**: CORS errors or connection refused

- Check that backend is running on correct port
- Verify `VITE_API_URL` in `.env` matches backend URL
- Check CORS configuration in backend

#### Build errors

**Issue**: TypeScript errors

```bash
# Check for type errors
npm run typecheck

# Fix linting issues
npm run lint -- --fix
```

#### Database issues

**Issue**: Database not initialized

```bash
cd backend
npm run seed  # If seed script exists
# Or manually initialize database
```

### Getting Help

- Check existing [Issues](https://github.com/yourusername/wardity/issues)
- Search [Discussions](https://github.com/yourusername/wardity/discussions)
- Create a new issue with:
  - Description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, Node version, etc.)

---

## 📚 Resources

### Documentation

- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Express](https://expressjs.com)

### Learning Resources

- [React Query Essentials](https://tanstack.com/query/latest/docs/react/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev) and [TypeScript](https://www.typescriptlang.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Heroicons](https://heroicons.com)
- Powered by [Vite](https://vitejs.dev)

---

## 📞 Contact

- **Project Repository**: [GitHub](https://github.com/yourusername/wardity)
- **Issues**: [GitHub Issues](https://github.com/yourusername/wardity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wardity/discussions)

---

**Made with ❤️ using React, TypeScript, and modern web technologies**
