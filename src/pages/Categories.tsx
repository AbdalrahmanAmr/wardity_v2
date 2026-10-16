import { FC } from "react";
import { useCategories } from "@/services/queries/categoryQueries";
import { CategoryCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export const Categories: FC = () => {
  const { data: categories, isLoading, isError, error } = useCategories();

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
          <ErrorBlock message={error?.message || "Failed to load categories"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">All Categories</h1>
          <p className="text-gray-600">Browse our wide selection of products</p>
        </div>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
};
