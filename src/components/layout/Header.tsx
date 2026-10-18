import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { DarkModeToggle } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  const wishlistCount = wishlist.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/50">
      {/* Top Bar */}
      <div className="bg-primary text-white py-2">
        <div className="container mx-auto px-4 text-center text-sm">
          {t("banner", { threshold: 2000 })}
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex min-w-0 items-center justify-between h-20 gap-1 sm:gap-3">
          {/* Logo */}
          <Link to="/" className="min-w-0 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl">🌷</span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-primary">Wardity</h1>
                <p className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 -mt-1">
                  A Blooming Connection
                </p>
              </div>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={
                  language === "ar" ? "ابحث عن المنتجات" : "Search products"
                }
                className="w-full ps-4 pe-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="submit"
                aria-label={language === "ar" ? "بحث" : "Search"}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="hidden lg:inline-flex rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              aria-label={
                language === "ar"
                  ? "Switch language to English"
                  : "Switch language to Arabic"
              }
            >
              {t("languageSwitch")}
            </button>
            {/* Dark Mode Toggle */}
            <div className="hidden lg:block">
              <DarkModeToggle />
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-1.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors sm:px-3"
                >
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name || t("account")}
                  </span>
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="hidden lg:inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-1.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors sm:px-3"
              >
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("login")}
                </span>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-1.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors sm:px-3"
            >
              <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("wishlist")}
              </span>
              {wishlistCount > 0 && (
                <span
                  dir="ltr"
                  className="absolute -top-1 -end-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-primary/5 px-1.5 py-2 hover:bg-primary/10 transition-colors sm:px-3"
            >
              <ShoppingBagIcon className="w-6 h-6 text-primary" />
              <span className="hidden lg:block text-sm font-medium text-primary">
                {t("basket")}
              </span>
              {itemCount > 0 && (
                <span
                  dir="ltr"
                  className="absolute -top-1 -end-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="min-h-11 min-w-11 p-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={
                isMenuOpen
                  ? language === "ar"
                    ? "إغلاق القائمة"
                    : "Close menu"
                  : language === "ar"
                    ? "فتح القائمة"
                    : "Open menu"
              }
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <form onSubmit={handleSearch} className="pb-4 lg:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={
                language === "ar" ? "ابحث عن المنتجات" : "Search products"
              }
              className="w-full ps-4 pe-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button
              type="submit"
              aria-label={language === "ar" ? "بحث" : "Search"}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
          <div className="container mx-auto px-4 py-4">
            <div className="mb-3 flex min-h-11 items-center justify-between rounded-lg bg-gray-50 px-4 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {language === "ar" ? "المظهر" : "Theme"}
              </span>
              <DarkModeToggle />
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              className="mb-3 w-full rounded-lg px-4 py-3 text-start font-semibold text-primary hover:bg-primary/5"
            >
              {t("languageSwitch")}
            </button>
            {/* Wishlist - Mobile */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors mb-2 font-semibold"
              >
                <span aria-hidden="true">✦</span>
                <span className="text-sm">Admin Panel</span>
              </Link>
            )}

            <Link
              to="/wishlist"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2"
            >
              <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="ml-auto w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
