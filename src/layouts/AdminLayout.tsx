import { FC, Suspense, useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { PageLoadingSpinner, ScrollToTop } from "@/components/ui";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminTranslations } from "@/locales/admin";
import { DarkModeToggle } from "@/components/ui";

export const AdminLayout: FC = () => {
  useDarkMode();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toggleLanguage, isRTL } = useLanguage();
  const t = useAdminTranslations();

  const navItems = [
    { name: t.dashboard, path: "/admin" },
    { name: t.products, path: "/admin/products" },
    { name: t.orders, path: "/admin/orders" },
    { name: t.deliveryLocations, path: "/admin/delivery-locations" },
    { name: t.categories, path: "/admin/categories" },
    { name: t.occasions, path: "/admin/occasions" },
    { name: t.carousel, path: "/admin/carousel" },
    { name: t.users, path: "/admin/users" },
    { name: t.settings, path: "/admin/settings" },
  ];

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/admin";
  const isItemActive = (path: string) =>
    path === "/admin"
      ? normalizedPath === "/admin"
      : normalizedPath === path || normalizedPath.startsWith(`${path}/`);

  return (
    <div className="min-h-screen flex bg-wardity-bg dark:bg-wardity-bg-dark text-wardity-text dark:text-wardity-text-dark">
      <ScrollToTop />
      {/* Sidebar */}
      {isSidebarOpen && <button aria-label="Close admin menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 ${isRTL ? "end-0" : "start-0"} z-40 w-72 max-w-[85vw] transform overflow-y-auto bg-white shadow-xl transition-transform dark:bg-wardity-card-dark lg:static lg:z-auto lg:block lg:w-64 lg:translate-x-0 lg:shadow-none ${isSidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="text-2xl font-bold font-serif italic text-wardity-primary">
            {t.dashboard === "لوحة التحكم" ? "إدارة Wardity" : "Wardity Admin"}
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-h-11 items-center rounded-lg border-s-4 px-4 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isItemActive(item.path)
                  ? "border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300"
                  : "border-transparent text-gray-700 hover:bg-primary/5 hover:text-primary dark:text-gray-200 dark:hover:bg-primary/10 dark:hover:text-primary-300"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Link
              to="/"
              className="block min-h-11 rounded-lg px-4 py-2 text-start text-gray-700 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-gray-200 dark:hover:bg-primary/10 dark:hover:text-primary-300"
            >
              &larr; {t.backToStore}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-wardity-card-dark lg:hidden">
          <button aria-label={isSidebarOpen ? "Close admin menu" : "Open admin menu"} onClick={() => setIsSidebarOpen((open) => !open)} className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-wardity-bg dark:hover:bg-wardity-bg-dark">
            {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
          <span className="font-bold">{t.dashboard === "لوحة التحكم" ? "إدارة Wardity" : "Wardity Admin"}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleLanguage} className="min-h-11 px-2 text-sm text-wardity-primary">{t.language}</button>
            <DarkModeToggle />
            <Link to="/" className="flex min-h-11 items-center px-2 text-sm text-wardity-primary">{t.backToStore}</Link>
          </div>
        </div>
        
        <div className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 md:p-8">
          <div className="mb-4 hidden items-center justify-end gap-3 lg:flex">
            <button type="button" onClick={toggleLanguage} className="min-h-11 rounded-lg px-3 text-sm text-wardity-primary hover:bg-wardity-bg dark:hover:bg-wardity-bg-dark">{t.language}</button>
            <DarkModeToggle />
          </div>
          <Suspense fallback={<PageLoadingSpinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};
