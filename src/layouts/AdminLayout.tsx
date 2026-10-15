import { FC, Suspense } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { PageLoadingSpinner, ScrollToTop } from "@/components/ui";
import { useDarkMode } from "@/hooks/useDarkMode";

export const AdminLayout: FC = () => {
  useDarkMode();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Occasions", path: "/admin/occasions" },
    { name: "Users", path: "/admin/users" },
  ];

  return (
    <div className="min-h-screen flex bg-wardity-bg dark:bg-wardity-bg-dark text-wardity-text dark:text-wardity-text-dark">
      <ScrollToTop />
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-wardity-card-dark border-r border-gray-200 dark:border-gray-800 hidden md:block">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="text-2xl font-bold font-serif italic text-wardity-primary">
            Wardity Admin
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path))
                  ? "bg-wardity-primary text-white"
                  : "hover:bg-wardity-bg dark:hover:bg-wardity-bg-dark"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
            <Link
              to="/"
              className="block px-4 py-2 rounded-lg text-gray-500 hover:bg-wardity-bg dark:hover:bg-wardity-bg-dark transition-colors"
            >
              &larr; Back to Store
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white dark:bg-wardity-card-dark border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <span className="font-bold">Wardity Admin</span>
          <Link to="/" className="text-sm text-wardity-primary">Store</Link>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Suspense fallback={<PageLoadingSpinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};
