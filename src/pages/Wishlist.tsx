import { FC } from "react";
import { Link } from "react-router-dom";
import { useWishlist as useWishlistQuery } from "@/services/queries/wishlistQueries";
import { useWishlist as useWishlistContext } from "@/contexts/WishlistContext";
import { ProductCard } from "@/components/features";
import { LoadingSpinner, ErrorBlock } from "@/components/ui";
import { HeartIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const Wishlist: FC = () => {
  // Try React Query first (API-based), fallback to context (local storage)
  const {
    data: wishlistData,
    isLoading,
    isError,
    error,
    refetch,
  } = useWishlistQuery();
  const { wishlist: contextWishlist } = useWishlistContext();

  // Determine which wishlist to use:
  // - If API has items, use API data
  // - If API is empty but context has data, use context (API might be unavailable)
  // - If API failed, use context
  // - Otherwise use context as fallback
  const apiHasData = !isError && wishlistData !== undefined && wishlistData.length > 0;
  const hasContextData = contextWishlist && contextWishlist.length > 0;
  
  // Use API if it has data, otherwise prefer context (which handles API unavailable gracefully)
  const wishlist = apiHasData ? wishlistData : (contextWishlist ?? []);

  // ========== CONDITIONAL RENDERS ==========
  // Show loading only if API is loading AND we don't have context data
  if (isLoading && !hasContextData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // Only show error if API failed AND context is also empty
  // If context has data, we'll use that instead
  if (isError && !hasContextData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <ErrorBlock
            title="Failed to load wishlist"
            message={error instanceof Error ? error.message : "An error occurred while loading your wishlist"}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <HeartIcon className="w-24 h-24 text-gray-300 dark:text-gray-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Your wishlist is empty
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start adding products you love to your wishlist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-sm hover:shadow-md"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/"
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};
