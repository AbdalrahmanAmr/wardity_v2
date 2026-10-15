import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  TruckIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { DarkModeToggle } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { useWishlist } from "@/contexts/WishlistContext";

export const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { location, setLocation, availableLocations } = useDeliveryLocation();
  const { wishlist } = useWishlist();
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const navigate = useNavigate();
  
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
          🌹 Free delivery on orders over 500 EGP | Same day delivery in Cairo & Giza
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🌷</span>
              <div>
                <h1 className="text-xl font-bold text-primary">Wardity</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-1">A Blooming Connection</p>
              </div>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Delivery Location */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setShowLocationMenu(!showLocationMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TruckIcon className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500">Delivery To</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {location.name}
                    <ChevronDownIcon className="w-3 h-3" />
                  </p>
                </div>
              </button>
              {showLocationMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50">
                  {availableLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        location.id === loc.id ? "bg-primary/5 text-primary" : ""
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name || "Account"}
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">Login</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
            >
              <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors relative"
            >
              <ShoppingBagIcon className="w-6 h-6 text-primary" />
              <span className="hidden sm:block text-sm font-medium text-primary">Basket</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
          <div className="container mx-auto px-4 py-4">
            {/* Delivery Location - Mobile */}
            <button className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 mb-4">
              <TruckIcon className="w-5 h-5 text-primary" />
              <div className="text-left flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Delivery To</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Greater Cairo</p>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Wishlist</span>
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
