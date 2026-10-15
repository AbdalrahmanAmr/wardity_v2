import { FC } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategory, useProducts } from "@/services/queries";
import { ProductCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export const CategoryDetail: FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || "");
  const { data: products, isLoading: productsLoading, isError, error } = useProducts(
    category?.name ? { category: category.name } : slug ? { category: slug } : undefined
  );

  if (categoryLoading) {
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
          <ErrorBlock message={error?.message || "Failed to load category"} />
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
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-900">{category?.name || slug}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {category?.name || slug}
          </h1>
          <p className="text-gray-600">
            {products && products.length > 0
              ? `${products.length} products available`
              : "Browse our collection"}
          </p>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No products found in this category</p>
            <Link
              to="/categories"
              className="text-primary hover:underline font-medium"
            >
              Browse all categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

