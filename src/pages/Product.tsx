import { FC, useState, useEffect, useRef } from "react";
import { useParams, Link, useLoaderData } from "react-router-dom";
import {
  ShoppingBagIcon,
  HeartIcon,
  ShareIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import type { ProductDetail } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProduct } from "@/services/queries/productQueries";
import { PageLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { shareToFacebook, shareToX, shareGeneric } from "@/utils/share";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAddToCart, trackAddToWishlist, trackViewContent } from "@/lib/tracking";

export const Product: FC = () => {
  const { id: productId } = useParams<{ id: string }>();
  const loaderData = useLoaderData() as ProductDetail | undefined;

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "sizes">(
    "description"
  );
  const trackedProductId = useRef<string | undefined>(undefined);

  // Fetch product data using React Query
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProduct(productId || "");

  // Use loader data if available, otherwise use query data
  const productData = loaderData || product;

  // Get selected size from product sizes
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    productData?.sizes?.find((s) => s.selected)?.name
  );

  // Update selected size when product data loads
  useEffect(() => {
    if (productData?.sizes && productData.sizes.length > 0) {
      const defaultSize =
        productData.sizes.find((s) => s.selected) || productData.sizes[0];
      if (defaultSize) {
        setSelectedSize(defaultSize.name);
      }
    }
  }, [productData]);
  useEffect(() => {
    if (productData && trackedProductId.current !== productData.id) {
      trackedProductId.current = productData.id;
      trackViewContent({ id: productData.id, name: productData.name, price: productData.isOnSale && productData.salePrice ? productData.salePrice : productData.price });
    }
  }, [productData]);

  // Contexts
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { language } = useLanguage();

  // Handlers
  const handleAddToCart = (): void => {
    if (!productData || productData.status === "Out of stock" || productData.stockQuantity === 0) return;
    addToCart(productData, quantity, selectedSize);
    trackAddToCart({ id: productData.id, name: productData.name, price: productData.isOnSale && productData.salePrice ? productData.salePrice : productData.price, quantity, selectedSize });
  };

  const handleToggleWishlist = (): void => {
    if (!productData) return;
    toggleWishlist(productData);
    if (!isInWishlist(productData.id)) trackAddToWishlist({ id: productData.id, name: productData.name, price: productData.isOnSale && productData.salePrice ? productData.salePrice : productData.price });
  };

  // Bundle handler - can be uncommented when bundle data is available
  // const handleAddBundleToCart = (bundle: Bundle): void => {
  //   if (!productData) return;
  //   // Add main product with bundle quantity
  //   addToCart(productData, 1, selectedSize);
  //   // Note: In a real app, you'd fetch and add the bundle product here
  // };

  const handleSizeSelect = (sizeName: string): void => {
    setSelectedSize(sizeName);
  };

  const handleShareFacebook = (): void => {
    if (!productData) return;
    const url = window.location.href;
    shareToFacebook(url, productData.name);
  };

  const handleShareX = (): void => {
    if (!productData) return;
    const url = window.location.href;
    shareToX(url, productData.name);
  };

  const handleShareGeneric = async (): Promise<void> => {
    if (!productData) return;
    const url = window.location.href;
    await shareGeneric(url, productData.name, productData.description || "");
  };

  // Conditional renders
  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ErrorBlock
          title="Product not found"
          message={
            error instanceof Error
              ? error.message
              : "An error occurred while loading the product"
          }
          onRetry={() => refetch()}
        />
        <div className="mt-6">
          <Link
            to="/"
            className="inline-block bg-primary text-white font-medium px-6 py-2.5 rounded-full hover:bg-primary-600 transition-colors shadow-sm text-sm"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ErrorBlock
          title="Product not found"
          message="The product you're looking for doesn't exist or has been removed."
        />
        <div className="mt-6">
          <Link
            to="/"
            className="inline-block bg-primary text-white font-medium px-6 py-2.5 rounded-full hover:bg-primary-600 transition-colors shadow-sm text-sm"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900">{productData.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
              <img
                src={
                  productData.gallery?.thumbnails?.[selectedImage] ||
                  productData.gallery?.mainImage ||
                  productData.image
                }
                alt={productData.name}
                className={`w-full h-full object-cover ${productData.status === "Out of stock" ? "grayscale opacity-60" : ""}`}
              />
              {productData.status === "Out of stock" && <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-xl font-bold text-white">{language === "ar" ? "غير متوفر" : "Out of stock"}</span>}
              {productData.isOnSale && <span className="absolute top-4 right-4 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">-{productData.discountPercent}%</span>}
              {productData.badge && (
                <span className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                  {productData.badge}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {productData.gallery?.thumbnails &&
              productData.gallery.thumbnails.length > 0 && (
                <div className="flex gap-3">
                  {productData.gallery.thumbnails.map((thumb, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={`${productData.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Status & SKU */}
            <div className="flex items-center gap-4">
              {productData.status && (
                <span className="flex items-center gap-1 text-success text-sm font-medium">
                  <CheckIcon className="w-4 h-4" />
                  {productData.status}
                </span>
              )}
              {productData.sku && (
                <span className="text-sm text-gray-500">
                  SKU: {productData.sku}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {productData.name}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                {productData.isOnSale && <span className="text-lg text-gray-400 line-through">{productData.price.toLocaleString()}</span>}
                <span className="text-3xl font-bold text-primary">
                  {(productData.salePrice ?? productData.price).toLocaleString()}
                </span>
                <span className="text-lg text-gray-500">EGP</span>
              </div>
              <p className="text-sm text-gray-500">VAT included</p>
            </div>

            {/* Size Selector */}
            {productData.sizes && productData.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose:
                </label>
                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => handleSizeSelect(size.name)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedSize === size.name
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {size.name} - {size.price.toLocaleString()} EGP
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex flex-wrap gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-3 font-medium min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={productData.status === "Out of stock" || productData.stockQuantity === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                {productData.status === "Out of stock" ? (language === "ar" ? "غير متوفر" : "Out of stock") : (language === "ar" ? "أضف إلى السلة" : "Add to cart")}
              </button>

              {/* Wishlist */}
              <button
                onClick={handleToggleWishlist}
                className="p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                aria-label="Add to wishlist"
              >
                {isInWishlist(productData.id) ? (
                  <HeartSolidIcon className="w-6 h-6 text-primary" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Share:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleShareFacebook}
                  className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  onClick={handleShareX}
                  className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                  aria-label="Share on X"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  onClick={handleShareGeneric}
                  className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Share"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fintech Options */}
            {productData.fintechProviders &&
              productData.fintechProviders.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {productData.fintechProviders.map((provider) => (
                      <span
                        key={provider.name}
                        className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm"
                      >
                        {provider.icon} {provider.name}
                      </span>
                    ))}
                  </div>

                  {/* Highlighted Offer */}
                  {productData.fintechProviders.find((p) => p.offer) && (
                    <div className="bg-white rounded-lg p-3 border border-primary/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {
                              productData.fintechProviders.find((p) => p.offer)
                                ?.offer?.text
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {
                              productData.fintechProviders.find((p) => p.offer)
                                ?.offer?.subtext
                            }
                          </p>
                        </div>
                        {productData.fintechProviders.find((p) => p.offer)
                          ?.offer?.promoBadge && (
                          <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded">
                            {
                              productData.fintechProviders.find((p) => p.offer)
                                ?.offer?.promoBadge
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TruckIcon className="w-5 h-5 text-primary" />
                Same-day delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                Satisfaction guaranteed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Tab Headers */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                activeTab === "description"
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("sizes")}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                activeTab === "sizes"
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Sizes
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl p-6">
            {activeTab === "description" && (
              <p className="text-gray-600 leading-relaxed">
                {productData.description ||
                  "A beautiful festive arrangement perfect for any celebration. Our skilled florists handcraft each piece with care, using only the freshest flowers and premium materials. This stunning display combines elegant blooms with decorative accents to create a memorable gift that will brighten any space."}
              </p>
            )}
            {activeTab === "sizes" && (
              <div className="space-y-3">
                {productData.sizes && productData.sizes.length > 0 ? (
                  productData.sizes.map((size) => (
                    <div
                      key={size.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{size.name}</span>
                      <span className="text-primary font-bold">
                        {size.price.toLocaleString()} EGP
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No size options available for this product.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bundle Cross-Sell - Optional section, can be removed or populated from API */}
      {/* Note: Bundles would typically come from the API based on the product */}
      {/* This section is commented out as bundles are not part of the ProductDetail type */}
      {/* Uncomment and modify when bundle data is available from the API */}
      {/* 
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            You can Buy it with...
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={productData.image}
                      alt={productData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <PlusIcon className="w-6 h-6 text-gray-400" />
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={bundle.addonProduct.image}
                      alt={bundle.addonProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {productData.name} + {bundle.addonProduct.name}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {bundle.totalBundlePrice.toLocaleString()} EGP
                  </p>
                </div>
                <button
                  onClick={() => handleAddBundleToCart(bundle)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  Add both to cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}
    </div>
  );
};
