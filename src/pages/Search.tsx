import { FC, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSearchProducts } from "@/services/queries/productQueries";
import { ProductCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import { trackSearch } from "@/lib/tracking";

export const Search: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      setSearchParams({ q: debouncedSearch });
    } else {
      setSearchParams({});
    }
  }, [debouncedSearch, setSearchParams]);
  useEffect(() => { if (debouncedSearch) trackSearch(debouncedSearch); }, [debouncedSearch]);

  const { data: products, isLoading, isError, error } = useSearchProducts(debouncedSearch);

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Results */}
        {!debouncedSearch ? (
          <div className="text-center py-16">
            <MagnifyingGlassIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Searching</h2>
            <p className="text-gray-600">Enter a search term to find products</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <ErrorBlock message={error?.message || "Failed to search products"} />
        ) : products && products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Found {products.length} {products.length === 1 ? "product" : "products"} for "{debouncedSearch}"
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-2">No products found</p>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};
