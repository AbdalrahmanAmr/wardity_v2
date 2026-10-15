import { FC } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRightIcon,
  TruckIcon,
  GiftIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  HeroBanner,
  ProductCard,
  OccasionCard,
  CategoryCard,
} from "@/components/features";
import { useProducts } from "@/services/queries/productQueries";
import type { Occasion, Category } from "@/types";

// Mock data from JSON
const occasions: Occasion[] = [
  { name: "New Year", imageType: "3D_snowman_tree" },
  { name: "Birthdays", imageType: "3D_cake_candles" },
  { name: "Anniversary", imageType: "3D_balloons" },
  { name: "Wedding", imageType: "3D_rings" },
  { name: "Thank you", imageType: "3D_sign" },
  { name: "Graduation", imageType: "3D_cap" },
  { name: "New Born", imageType: "3D_clouds" },
];

const ProductCardSkeleton: FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  </div>
);

const categories: Category[] = [
  {
    name: "Hand Bouquets",
    imageType: "illustration_bouquet",
    bgColor: "#FFF5F7",
  },
  { name: "Boxes", imageType: "illustration_box_roses", bgColor: "#FFF5F7" },
  { name: "Vases", imageType: "illustration_vase_flowers", bgColor: "#FFF5F7" },
  {
    name: "Plants",
    imageType: "illustration_potted_plant",
    bgColor: "#FFF5F7",
  },
];

export const Home: FC = () => {
  const { data: products, isLoading: productsLoading } = useProducts();

  // Flowers bouquets / featured products (up to 6 items)
  const featuredProducts = products?.slice(0, 6) || [];

  // Best sellers (products with "Best Seller" badge or top 4 items)
  const bestSellers =
    products?.filter((p) => p.badge === "Best Seller") || [];
  const displayBestSellers =
    bestSellers.length > 0 ? bestSellers : products?.slice(0, 4) || [];

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Occasions Carousel */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Occasions
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-2 md:gap-4 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7">
            {occasions.map((occasion) => (
              <div key={occasion.name} className="flex-shrink-0 w-24 md:w-auto">
                <OccasionCard occasion={occasion} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Year Collection */}
      <section className="py-12 bg-wardity-bg dark:bg-wardity-bg-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Flowers bouquets
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Celebrate with our festive collection
              </p>
            </div>
            <Link
              to="/collections/new-year"
              className="hidden md:flex items-center gap-1 text-primary font-medium hover:underline"
            >
              View All
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {productsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                <p className="text-gray-500 dark:text-gray-400">
                  No products available in this collection.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link
              to="/collections/new-year"
              className="inline-flex items-center gap-1 text-primary font-medium"
            >
              View All Products
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Best Sellers
            </h2>
            <Link
              to="/best-sellers"
              className="flex items-center gap-1 text-primary font-medium hover:underline"
            >
              View More
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : displayBestSellers.length > 0 ? (
              displayBestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <p className="text-gray-500 dark:text-gray-400">
                  No best sellers available at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-wardity-bg dark:bg-wardity-bg-dark">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Features / Benefits */}
      <section className="py-16 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            Our Benefits
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="order-2 md:order-1">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=400&fit=crop"
                  alt="Wardity Delivery"
                  className="rounded-2xl shadow-lg w-full"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/5 rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Same-Day Delivery
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Experience same-day flower delivery to Cairo and Giza. Swift
                shipping, ensuring your sentiments are delivered promptly and
                your gifts arrive fresh.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <GiftIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Free Gift Wrapping
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    100% Satisfaction
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stay Connected with Wardity
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Subscribe to our newsletter for exclusive offers, new arrivals, and
            flower care tips.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              // In a real app, you'd call an API here
              console.log("Newsletter subscription:", email);
              alert("Thank you for subscribing!");
              e.currentTarget.reset();
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-white text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
