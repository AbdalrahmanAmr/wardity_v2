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

  const isWishlisted = isWishlistedProp ?? isInWishlist(product.id);
  const isOutOfStock = product.status === "Out of stock" || product.stockQuantity === 0;
  const displayPrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCartProp) {
      onAddToCartProp(product);
    } else {
      addToCart(product);
    }
    trackAddToCart({ id: product.id, name: product.name, price: product.isOnSale && product.salePrice ? product.salePrice : product.price, quantity: 1 });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlistProp) {
      onToggleWishlistProp(product);
    } else {
      toggleWishlist(product);
    }
    if (!isWishlisted) trackAddToWishlist({ id: product.id, name: product.name, price: product.isOnSale && product.salePrice ? product.salePrice : product.price });
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
          src={product.image || `https://placehold.co/400x400/FFF0F3/D02046?text=${encodeURIComponent(product.name.slice(0, 10))}`}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-60" : ""}`}
        />

        {/* Badge */}
        {product.badge && (
          <span className="badge-new z-10">{product.badge}</span>
        )}
        {product.isOnSale && <span className="absolute top-3 left-3 z-10 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">-{product.discountPercent}%</span>}
        {isOutOfStock && <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-sm font-bold text-white">{language === "ar" ? "غير متوفر" : "Out of stock"}</span>}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800 hover:scale-110 transition-all z-20"
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
          className="absolute bottom-3 right-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 z-20 disabled:pointer-events-none disabled:opacity-0"
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
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-bold text-primary">
            {product.isOnSale && <span className="mr-2 text-sm text-gray-400 line-through">{product.price.toLocaleString()}</span>}
            {displayPrice.toLocaleString()} <span className="text-sm font-normal">EGP</span>
          </p>
        </div>
      </div>
    </Link>
  );
};
