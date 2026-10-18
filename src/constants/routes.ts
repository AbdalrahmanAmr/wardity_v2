/**
 * Application routes
 * Centralized route definitions for type safety and consistency
 */
export const ROUTES = {
  HOME: "/",
  PRODUCT: "/product/:id",
  PRODUCT_BY_ID: (id: string) => `/product/${id}`,
  CATEGORIES: "/categories",
  CATEGORY: "/categories/:slug",
  CATEGORY_BY_SLUG: (slug: string) => `/categories/${slug}`,
  OCCASIONS: "/occasions",
  OCCASION: "/occasions/:slug",
  OCCASION_BY_SLUG: (slug: string) => `/occasions/${slug}`,
  BRANDS: "/brands",
  SPECIAL_GIFTS: "/special-gifts",
  COLLECTION: "/collections/:slug",
  COLLECTION_BY_SLUG: (slug: string) => `/collections/${slug}`,
  BEST_SELLERS: "/best-sellers",
  CART: "/cart",
  CONTACT: "/contact",
  ABOUT: "/about",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;
