import { FC } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/services/queries/productQueries";
import { ProductCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export const Brands: FC = () => {
  const { data: products, isLoading, isError, error } = useProducts();

  // Extract unique brands from products
  const brands = products
    ? Array.from(new Set(products.filter((p) => p.brandLogo).map((p) => p.brandLogo!)))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wardity-bg py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-wardity-bg py-12">
        <div className="container mx-auto px-4">
          <ErrorBlock message={error?.message || "Failed to load brands"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our Brands</h1>
          <p className="text-gray-600">Shop from your favorite brands</p>
        </div>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {brands.map((brand) => (
              <Link
                key={brand}
                to={`/brands/${brand.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl font-bold text-primary mb-2">{brand}</div>
                <p className="text-sm text-gray-600">
                  {products?.filter((p) => p.brandLogo === brand).length} products
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No brands found</p>
          </div>
        )}

        {/* Featured Brand Products */}
        {products && products.filter((p) => p.brandLogo).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Brand Products</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products
                .filter((p) => p.brandLogo)
                .slice(0, 12)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
