import { FC } from "react";
import { Link } from "react-router-dom";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import type { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAddToCart, trackAddToWishlist } from "@/lib/tracking";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
}

export const ProductCard: FC<ProductCardProps> = ({
  product,
  onAddToCart: onAddToCartProp,
  onToggleWishlist: onToggleWishlistProp,
  isWishlisted: isWishlistedProp,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { language } = useLanguage();
  const displayName =
    language === "ar"
      ? product.nameAr || (
          <span lang="en" dir="ltr">
            {product.name}
          </span>
        )
      : product.name;

  const isWishlisted = isWishlistedProp ?? isInWishlist(product.id);
  const isOutOfStock =
    product.status === "Out of stock" || product.stockQuantity === 0;
  const displayPrice =
    product.isOnSale && product.salePrice ? product.salePrice : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCartProp) {
      onAddToCartProp(product);
    } else {
      addToCart(product);
    }
    trackAddToCart({
      id: product.id,
      name: product.name,
      price:
        product.isOnSale && product.salePrice
          ? product.salePrice
          : product.price,
      quantity: 1,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlistProp) {
      onToggleWishlistProp(product);
    } else {
      toggleWishlist(product);
    }
    if (!isWishlisted)
      trackAddToWishlist({
        id: product.id,
        name: product.name,
        price:
          product.isOnSale && product.salePrice
            ? product.salePrice
            : product.price,
      });
  };

  // Ensure product has a valid ID
  if (!product.id) {
    console.error("ProductCard: product.id is missing", product);
    return null;
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900 transition-all duration-300 card-hover cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
        <img
          src={
            product.image ||
            `https://placehold.co/400x400/FFF0F3/D02046?text=${encodeURIComponent(product.name.slice(0, 10))}`
          }
          alt={product.name}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-60" : ""}`}
        />

        {/* Badge */}
        {product.badge && (
          <span className="badge-new z-10">{product.badge}</span>
        )}
        {product.isOnSale && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-sm font-bold text-white">
            {language === "ar" ? "غير متوفر" : "Out of stock"}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isWishlisted ? (
            <HeartSolidIcon className="w-5 h-5 text-primary" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          )}
        </button>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="absolute bottom-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:pointer-events-none disabled:opacity-0 sm:h-11 sm:w-11"
          aria-label="Add to cart"
        >
          <ShoppingBagIcon className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        {product.brandLogo && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-200">
            {product.brandLogo}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 p-3 sm:p-4">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
          <span dir="auto">{displayName}</span>
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="min-w-0 text-base font-bold text-primary sm:text-lg">
            {product.isOnSale && (
              <span className="mr-1 text-xs text-gray-400 line-through sm:mr-2 sm:text-sm">
                {product.price.toLocaleString()}
              </span>
            )}
            <span className="whitespace-nowrap">
              {displayPrice.toLocaleString()}{" "}
              <span className="text-xs font-normal sm:text-sm">EGP</span>
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
};
