/**
 * Product-related types
 */
export const BEST_SELLER_BADGE = "Best Seller";

export const normalizeBestSellerBadge = (badge?: string | null) => {
  if (typeof badge !== "string") return null;

  const trimmed = badge.trim();
  if (!trimmed) return null;

  return trimmed.toLowerCase() === BEST_SELLER_BADGE.toLowerCase()
    ? BEST_SELLER_BADGE
    : null;
};

export const isBestSellerProduct = (product?: Pick<Product, "badge"> | null) =>
  normalizeBestSellerBadge(product?.badge) === BEST_SELLER_BADGE;

export interface Product {
  id: string;
  name: string;
  nameAr?: string | null;
  price: number;
  salePrice?: number | null;
  isOnSale?: boolean;
  discountPercent?: number;
  saleEndsAt?: string | null;
  stockQuantity?: number | null;
  badge?: string | null;
  image: string;
  images?: string[];
  imageDesc?: string;
  brandLogo?: string | null;
  status?: "In stock" | "Out of stock";
  sku?: string;
  description?: string;
  descriptionAr?: string | null;
  categoryId?: string | null;
  occasionId?: string | null;
  category_id?: string | null;
  occasion_id?: string | null;
}

export interface ProductDetail extends Product {
  gallery: {
    mainImage: string;
    thumbnails: string[];
  };
  description?: string;
  sizes?: ProductSize[];
  fintechProviders?: FintechProvider[];
}

export interface ProductSize {
  name: string;
  price: number;
  selected?: boolean;
}

export interface FintechProvider {
  name: string;
  icon?: string;
  offer?: {
    text: string;
    subtext: string;
    promoBadge?: string;
  };
}

export interface Bundle {
  id: string;
  mainProductPrice: number;
  addonProduct: {
    name: string;
    price: number;
    image: string;
  };
  totalBundlePrice: number;
}
