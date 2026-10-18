import { FC } from "react";
import { useOccasions } from "@/services/queries/categoryQueries";
import { OccasionCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";

export const Occasions: FC = () => {
  const { data: occasions, isLoading, isError, error } = useOccasions();

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
          <ErrorBlock message={error?.message || "Failed to load occasions"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">All Occasions</h1>
          <p className="text-gray-600">Find the perfect gift for every occasion</p>
        </div>

        {occasions && occasions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {occasions.map((occasion) => (
              <OccasionCard key={occasion.id ?? occasion.slug ?? occasion.name} occasion={occasion} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No occasions found</p>
          </div>
        )}
      </div>
    </div>
  );
};
