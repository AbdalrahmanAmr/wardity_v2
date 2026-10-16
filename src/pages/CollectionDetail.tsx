import { FC } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "@/services/queries/productQueries";
import { ProductCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export const CollectionDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: products, isLoading, isError, error } = useProducts(
    slug ? { collection: slug } : undefined
  );

  // Format collection name from slug
  const collectionName = slug
    ? slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

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
          <ErrorBlock message={error?.message || "Failed to load collection"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-900">{collectionName}</span>
        </nav>

        {/* Collection Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {collectionName}
          </h1>
          <p className="text-gray-600">
            {products && products.length > 0
              ? `${products.length} products in this collection`
              : "Browse our collection"}
          </p>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No products found in this collection</p>
            <Link
              to="/"
              className="text-primary hover:underline font-medium"
            >
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
