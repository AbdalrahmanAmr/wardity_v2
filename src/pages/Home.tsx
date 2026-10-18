import { FC, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF } from "react-icons/fa";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  TruckIcon,
  GiftIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Carousel } from "@/components/ui";
import {
  HeroBanner,
  ProductCard,
  OccasionCard,
  CategoryCard,
} from "@/components/features";
import { useProducts } from "@/services/queries/productQueries";
import {
  useCategories,
  useOccasions,
} from "@/services/queries/categoryQueries";
import type { Occasion, Category } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { isBestSellerProduct } from "@/types/product";
import { api } from "@/services/api";
import { env } from "@/config/env";

interface NewsletterFeedback {
  type: "success" | "error";
  message: string;
}

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
  const { t, language } = useLanguage();
  const [newsletterFeedback, setNewsletterFeedback] =
    useState<NewsletterFeedback | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { data: products, isLoading: productsLoading } = useProducts();
  const occasionsQuery = useOccasions();
  const categoriesQuery = useCategories();
  const homeOccasions = occasionsQuery.isError
    ? occasions
    : occasionsQuery.data || [];
  const homeCategories = categoriesQuery.isError
    ? categories
    : categoriesQuery.data || [];

  // Flowers bouquets / featured products (up to 6 items)
  const featuredProducts = products?.slice(0, 6) || [];

  // Best sellers (products marked as best sellers, falling back to the first four products)
  const bestSellers = products?.filter(isBestSellerProduct) || [];
  const displayBestSellers =
    bestSellers.length > 0 ? bestSellers : products?.slice(0, 4) || [];

  const handleNewsletterSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    setNewsletterFeedback(null);
    setIsSubscribing(true);

    try {
      await api.post<{ message: string }>("/newsletter", { email });
      form.reset();
      setNewsletterFeedback({
        type: "success",
        message:
          language === "ar"
            ? "شكراً لاشتراككم! ترقبوا رسائلنا في بريدكم الإلكتروني."
            : "Thanks for subscribing! Keep an eye on your inbox.",
      });
    } catch {
      setNewsletterFeedback({
        type: "error",
        message:
          language === "ar"
            ? "تعذر إتمام الاشتراك الآن. يرجى المحاولة مرة أخرى."
            : "We couldn't subscribe you right now. Please try again.",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Occasions Carousel */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {language === "ar" ? "المناسبات" : "Occasions"}
            </h2>
          </div>

          <Carousel
            ariaLabel="Occasions"
            wrapAt={7}
            wrapClassName="grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
            showDots
            className="-mx-4 px-4 md:mx-0 md:px-0"
            gapClassName="gap-2 md:gap-4"
            itemClassName="basis-[calc((100%-1rem)/3)] md:basis-[calc((100%-3rem)/4)] lg:basis-[calc((100%-6rem)/7)]"
          >
            {homeOccasions.map((occasion) => (
              <OccasionCard key={occasion.name} occasion={occasion} />
            ))}
          </Carousel>
        </div>
      </section>

      {/* New Year Collection */}
      <section className="py-12 bg-wardity-bg dark:bg-wardity-bg-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {language === "ar" ? "باقات الزهور" : "Flowers bouquets"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {language === "ar"
                  ? "احتفلوا مع مجموعتنا المميزة"
                  : "Celebrate with our festive collection"}
              </p>
            </div>
            <Link
              to="/collections/new-year"
              className="hidden md:flex items-center gap-1 text-primary font-medium hover:underline"
            >
              {t("viewAll")}
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {productsLoading ? (
            <Carousel
              ariaLabel="Featured products"
              itemClassName="basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-6rem)/4)]"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </Carousel>
          ) : featuredProducts.length > 0 ? (
            <Carousel
              ariaLabel="Featured products"
              showDots
              itemClassName="basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-6rem)/4)]"
            >
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </Carousel>
          ) : (
            <div className="rounded-2xl bg-white/50 py-12 text-center dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400">
                No products available in this collection.
              </p>
            </div>
          )}

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
              {t("bestSellers")}
            </h2>
            <Link
              to="/best-sellers"
              className="flex items-center gap-1 text-primary font-medium hover:underline"
            >
              {language === "ar" ? "عرض المزيد" : "View More"}
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {productsLoading ? (
            <Carousel
              ariaLabel="Best sellers"
              itemClassName="basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-6rem)/4)]"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </Carousel>
          ) : displayBestSellers.length > 0 ? (
            <Carousel
              ariaLabel="Best sellers"
              showDots
              itemClassName="basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-6rem)/4)]"
            >
              {displayBestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </Carousel>
          ) : (
            <div className="rounded-2xl bg-gray-50 py-12 text-center dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400">
                No best sellers available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-wardity-bg dark:bg-wardity-bg-dark">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {language === "ar" ? "الفئات" : "Categories"}
            </h2>
          </div>

          <Carousel
            ariaLabel="Categories"
            wrapAt={4}
            wrapClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            className="-mx-4 px-4 md:mx-0 md:px-0"
            itemClassName="basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]"
          >
            {homeCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </Carousel>
        </div>
      </section>

      {/* Features / Benefits */}
      <section className="py-16 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            {language === "ar" ? "مميزاتنا" : "Our Benefits"}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="order-2 md:order-1">
              <div className="relative">
                <img
                  src="/delv.jpeg"
                  alt={language === "ar" ? "توصيل ورديتي" : "Wardity Delivery"}
                  className="rounded-2xl shadow-lg w-full"
                />
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
                  {language === "ar"
                    ? "توصيل في نفس اليوم"
                    : "Same-Day Delivery"}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {language === "ar"
                  ? "استمتعوا بتوصيل الزهور في نفس اليوم داخل القاهرة فقط. نضمن وصول مشاعركم وهداياكم طازجة وفي الوقت المناسب."
                  : "Experience same-day flower delivery in Cairo only. Swift delivery, ensuring your sentiments are delivered promptly and your gifts arrive fresh."}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <GiftIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === "ar"
                      ? "تغليف هدايا مجاني"
                      : "Free Gift Wrapping"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === "ar" ? "رضا بنسبة ١٠٠٪" : "100% Satisfaction"}
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
            {language === "ar"
              ? "ابقوا على تواصل مع ورديتي"
              : "Stay Connected with Wardity"}
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            {language === "ar"
              ? "اشتركوا في نشرتنا للحصول على عروض حصرية وكل جديد ونصائح العناية بالزهور."
              : "Subscribe to our newsletter for exclusive offers, new arrivals, and flower care tips."}
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="email"
              aria-label={
                language === "ar" ? "البريد الإلكتروني" : "Email address"
              }
              placeholder={
                language === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"
              }
              required
              disabled={isSubscribing}
              className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="px-8 py-3 bg-white text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors disabled:cursor-wait disabled:opacity-70"
            >
              {isSubscribing
                ? language === "ar"
                  ? "جارٍ الاشتراك..."
                  : "Subscribing..."
                : language === "ar"
                  ? "اشتراك"
                  : "Subscribe"}
            </button>
          </form>
          {newsletterFeedback && (
            <div
              role={newsletterFeedback.type === "error" ? "alert" : "status"}
              aria-live={newsletterFeedback.type === "error" ? "assertive" : "polite"}
              className={`mt-5 mx-auto flex max-w-md items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-start shadow-lg ${
                newsletterFeedback.type === "success"
                  ? "border-green-200 text-green-800"
                  : "border-red-200 text-red-800"
              }`}
            >
              {newsletterFeedback.type === "success" ? (
                <CheckCircleIcon
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                />
              ) : (
                <ExclamationCircleIcon
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                />
              )}
              <p className="flex-1 text-sm font-medium leading-5">
                {newsletterFeedback.message}
              </p>
              <button
                type="button"
                onClick={() => setNewsletterFeedback(null)}
                aria-label={language === "ar" ? "إغلاق التنبيه" : "Dismiss notification"}
                className="shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <XMarkIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
          <a
            href={env.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            <FaFacebookF aria-hidden="true" />
            {language === "ar"
              ? "تابعوا ورديتي على فيسبوك"
              : "Follow Wardity on Facebook"}
          </a>
        </div>
      </section>
    </div>
  );
};
