/**
 * Product-related types
 */
export interface Product {
  id: string;
  name: string;
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
