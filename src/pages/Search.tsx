import { FC, useState, useEffect, useMemo, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useSearchProducts,
  type ProductSearchFilters,
} from "@/services/queries/productQueries";
import { useCategories } from "@/services/queries/categoryQueries";
import { ProductCard } from "@/components/features";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import { trackSearch } from "@/lib/tracking";
import { useLanguage } from "@/contexts/LanguageContext";

const sortValues = ["relevance", "price-asc", "price-desc", "newest"] as const;

function readFilters(params: URLSearchParams): ProductSearchFilters {
  const sortBy = params.get("sortBy");
  const availability = params.get("availability");
  return {
    categoryId: params.get("categoryId") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    availability:
      availability === "in-stock" || availability === "out-of-stock"
        ? availability
        : undefined,
    onSale: params.get("onSale") === "true",
    sortBy: sortValues.includes(sortBy as (typeof sortValues)[number])
      ? (sortBy as ProductSearchFilters["sortBy"])
      : "relevance",
  };
}

export const Search: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const debouncedSearch = useDebounce(searchTerm.trim(), 450);
  const normalizedQuery = debouncedSearch.trim();
  const debouncedFilters = useDebounce(filters, 250);
  const categoriesQuery = useCategories();
  const hasActiveFilters = Boolean(
    debouncedFilters.categoryId ||
    debouncedFilters.minPrice ||
    debouncedFilters.maxPrice ||
    debouncedFilters.availability ||
    debouncedFilters.onSale,
  );
  const hasSearch = normalizedQuery.length >= 2 || hasActiveFilters;

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    if (normalizedQuery) trackSearch(normalizedQuery);
  }, [normalizedQuery]);

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useSearchProducts(normalizedQuery, debouncedFilters);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = searchTerm.trim();
    setSearchTerm(nextValue);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextValue) next.set("q", nextValue);
      else next.delete("q");
      return next;
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const updateFilter = (key: string, value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value.trim()) next.set("q", value.trim());
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  };

  const searchPlaceholder =
    language === "ar" ? "ابحث عن المنتجات..." : "Search for products...";
  const emptyTitle = language === "ar" ? "ابدأ البحث" : "Start searching";
  const emptyText =
    language === "ar"
      ? "اكتب كلمة مفتاحية أو اختر الفلاتر لاستعراض المنتجات."
      : "Enter a keyword or choose filters to browse products.";
  const resultHeading = normalizedQuery
    ? language === "ar"
      ? `تم العثور على ${products?.length ?? 0} ${(products?.length ?? 0) === 1 ? "منتج" : "منتجات"} لـ "${normalizedQuery}"`
      : `Found ${products?.length ?? 0} ${(products?.length ?? 0) === 1 ? "product" : "products"} for "${normalizedQuery}"`
    : language === "ar"
      ? `المنتجات المطابقة للفلاتر (${products?.length ?? 0})`
      : `Products matching filters (${products?.length ?? 0})`;
  const noResultsTitle =
    language === "ar" ? "لا توجد منتجات مطابقة" : "No matching products";
  const noResultsText =
    language === "ar"
      ? "جرب كلمة مختلفة أو تحقق من التهجئة."
      : "Try a different keyword or spelling.";

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl">
          <form role="search" onSubmit={handleSubmit} className="relative">
            <label htmlFor="site-search" className="sr-only">
              {language === "ar" ? "بحث المنتجات" : "Search products"}
            </label>
            <input
              id="site-search"
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              maxLength={100}
              list="search-product-suggestions"
              placeholder={searchPlaceholder}
              aria-label={
                language === "ar" ? "بحث المنتجات" : "Search products"
              }
              className="w-full rounded-full border border-gray-200 bg-white py-4 pl-12 pr-12 text-lg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <MagnifyingGlassIcon
              className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label={language === "ar" ? "مسح البحث" : "Clear search"}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <button type="submit" className="sr-only">
              {language === "ar" ? "بحث" : "Search"}
            </button>
            <datalist id="search-product-suggestions">
              {products?.slice(0, 8).map((product) => (
                <option
                  key={product.id}
                  value={
                    language === "ar"
                      ? product.nameAr || product.name
                      : product.name
                  }
                  label={product.sku || undefined}
                />
              ))}
            </datalist>
          </form>
        </div>

        <section
          aria-label={language === "ar" ? "تصفية المنتجات" : "Filter products"}
          className="mx-auto mb-8 grid max-w-5xl grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-1">
            {language === "ar" ? "الفئة" : "Category"}
            <select
              value={filters.categoryId || ""}
              onChange={(event) =>
                updateFilter("categoryId", event.target.value)
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">
                {language === "ar" ? "كل الفئات" : "All categories"}
              </option>
              {categoriesQuery.data
                ?.filter((category) => category.id)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {language === "ar"
                      ? category.nameAr || category.name
                      : category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {language === "ar" ? "السعر من" : "Price from"}
            <input
              type="number"
              min="0"
              max="99999999"
              step="0.01"
              inputMode="decimal"
              value={filters.minPrice || ""}
              onChange={(event) => updateFilter("minPrice", event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {language === "ar" ? "السعر إلى" : "Price to"}
            <input
              type="number"
              min="0"
              max="99999999"
              step="0.01"
              inputMode="decimal"
              value={filters.maxPrice || ""}
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {language === "ar" ? "التوفر" : "Availability"}
            <select
              value={filters.availability || "all"}
              onChange={(event) =>
                updateFilter(
                  "availability",
                  event.target.value === "all" ? "" : event.target.value,
                )
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">{language === "ar" ? "الكل" : "All"}</option>
              <option value="in-stock">
                {language === "ar" ? "متوفر" : "In stock"}
              </option>
              <option value="out-of-stock">
                {language === "ar" ? "غير متوفر" : "Out of stock"}
              </option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {language === "ar" ? "الترتيب" : "Sort by"}
            <select
              value={filters.sortBy || "relevance"}
              onChange={(event) =>
                updateFilter(
                  "sortBy",
                  event.target.value === "relevance" ? "" : event.target.value,
                )
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="relevance">
                {language === "ar" ? "الأكثر صلة" : "Relevance"}
              </option>
              <option value="price-asc">
                {language === "ar" ? "السعر: من الأقل" : "Price: low to high"}
              </option>
              <option value="price-desc">
                {language === "ar" ? "السعر: من الأعلى" : "Price: high to low"}
              </option>
              <option value="newest">
                {language === "ar" ? "الأحدث" : "Newest"}
              </option>
            </select>
          </label>
          <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-1">
            <input
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(event) =>
                updateFilter("onSale", event.target.checked ? "true" : "")
              }
              className="h-4 w-4 rounded border-gray-400 text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            {language === "ar" ? "عروض فقط" : "On sale"}
          </label>
          {(hasActiveFilters || normalizedQuery) && (
            <button
              type="button"
              onClick={clearSearch}
              className="col-span-2 min-h-11 text-start text-sm font-semibold text-primary underline-offset-2 hover:underline sm:col-span-1"
            >
              {language === "ar"
                ? "مسح البحث والفلاتر"
                : "Clear search and filters"}
            </button>
          )}
        </section>

        {!hasSearch ? (
          <div className="py-16 text-center">
            <MagnifyingGlassIcon
              className="mx-auto mb-4 h-24 w-24 text-gray-300"
              aria-hidden="true"
            />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {emptyTitle}
            </h2>
            <p className="text-gray-600">{emptyText}</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <ErrorBlock
            message={
              error?.message ||
              (language === "ar"
                ? "فشل البحث عن المنتجات"
                : "Failed to search products")
            }
          />
        ) : products && products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {resultHeading}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="mb-2 text-xl font-medium text-gray-700">
              {noResultsTitle}
            </p>
            <p className="text-gray-500">{noResultsText}</p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-600"
            >
              {language === "ar" ? "مسح البحث" : "Clear search"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
