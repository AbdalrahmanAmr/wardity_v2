import { lazy, type ComponentType } from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { NotFound } from "@/pages/NotFound";
import { categoryLoader, occasionLoader } from "./loaders";

function lazyPage<T extends ComponentType>(
  loader: () => Promise<unknown>,
  exportName: string,
) {
  return lazy(async () => {
    const page = (await loader()) as Record<string, T>;
    return { default: page[exportName]! };
  });
}

const Home = lazyPage(() => import("@/pages/Home"), "Home");
const Product = lazyPage(() => import("@/pages/Product"), "Product");
const Cart = lazyPage(() => import("@/pages/Cart"), "Cart");
const Login = lazyPage(() => import("@/pages/Login"), "Login");
const Register = lazyPage(() => import("@/pages/Register"), "Register");
const Search = lazyPage(() => import("@/pages/Search"), "Search");
const Checkout = lazyPage(() => import("@/pages/Checkout"), "Checkout");
const Categories = lazyPage(() => import("@/pages/Categories"), "Categories");
const CategoryDetail = lazyPage(
  () => import("@/pages/CategoryDetail"),
  "CategoryDetail",
);
const Occasions = lazyPage(() => import("@/pages/Occasions"), "Occasions");
const OccasionDetail = lazyPage(
  () => import("@/pages/OccasionDetail"),
  "OccasionDetail",
);
const Brands = lazyPage(() => import("@/pages/Brands"), "Brands");
const SpecialGifts = lazyPage(
  () => import("@/pages/SpecialGifts"),
  "SpecialGifts",
);
const CollectionDetail = lazyPage(
  () => import("@/pages/CollectionDetail"),
  "CollectionDetail",
);
const BestSellers = lazyPage(
  () => import("@/pages/BestSellers"),
  "BestSellers",
);
const Wishlist = lazyPage(() => import("@/pages/Wishlist"), "Wishlist");
const Profile = lazyPage(() => import("@/pages/Profile"), "Profile");
const Orders = lazyPage(() => import("@/pages/Orders"), "Orders");
const OrderTracking = lazyPage(
  () => import("@/pages/OrderTracking"),
  "OrderTracking",
);
const Contact = lazyPage(() => import("@/pages/Contact"), "Contact");
const About = lazyPage(() => import("@/pages/About"), "About");
const Privacy = lazyPage(() => import("@/pages/Privacy"), "Privacy");
const Terms = lazyPage(() => import("@/pages/Terms"), "Terms");
const AdminDashboard = lazyPage(
  () => import("@/pages/admin/AdminDashboard"),
  "AdminDashboard",
);
const AdminProducts = lazyPage(
  () => import("@/pages/admin/AdminProducts"),
  "AdminProducts",
);
const AdminOrders = lazyPage(
  () => import("@/pages/admin/AdminOrders"),
  "AdminOrders",
);
const AdminCategories = lazyPage(
  () => import("@/pages/admin/AdminCategories"),
  "AdminCategories",
);
const AdminOccasions = lazyPage(
  () => import("@/pages/admin/AdminOccasions"),
  "AdminOccasions",
);
const AdminUsers = lazyPage(
  () => import("@/pages/admin/AdminUsers"),
  "AdminUsers",
);
const AdminCarousel = lazyPage(
  () => import("@/pages/admin/AdminCarousel"),
  "AdminCarousel",
);
const AdminSettings = lazyPage(
  () => import("@/pages/admin/AdminSettings"),
  "AdminSettings",
);
const AdminDeliveryLocations = lazyPage(
  () => import("@/pages/admin/AdminDeliveryLocations"),
  "AdminDeliveryLocations",
);

const ProductError = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-wardity-bg dark:bg-wardity-bg-dark py-16 px-4">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Product Not Found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The product you are looking for does not exist, has been removed, or
        could not be loaded.
      </p>
      <Link
        to="/"
        className="inline-block bg-primary text-white font-medium px-6 py-3 rounded-full hover:bg-primary-600 transition-colors shadow-sm"
      >
        Back to Shop
      </Link>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "product/:id",
        element: <Product />,
        errorElement: <ProductError />,
      },
      {
        path: "categories",
        element: <Categories />,
      },
      {
        path: "categories/:slug",
        element: <CategoryDetail />,
        loader: categoryLoader,
      },
      {
        path: "occasions",
        element: <Occasions />,
      },
      {
        path: "occasions/:slug",
        element: <OccasionDetail />,
        loader: occasionLoader,
      },
      {
        path: "brands",
        element: <Brands />,
      },
      {
        path: "special-gifts",
        element: <SpecialGifts />,
      },
      {
        path: "collections/:slug",
        element: <CollectionDetail />,
      },
      {
        path: "best-sellers",
        element: <BestSellers />,
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "checkout",
        element: <Checkout />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "wishlist",
        element: <Wishlist />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "orders/:id",
        element: <OrderTracking />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "privacy",
        element: <Privacy />,
      },
      {
        path: "terms",
        element: <Terms />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "products",
        element: <AdminProducts />,
      },
      {
        path: "orders",
        element: <AdminOrders />,
      },
      {
        path: "categories",
        element: <AdminCategories />,
      },
      {
        path: "occasions",
        element: <AdminOccasions />,
      },
      {
        path: "users",
        element: <AdminUsers />,
      },
      {
        path: "carousel",
        element: <AdminCarousel />,
      },
      {
        path: "settings",
        element: <AdminSettings />,
      },
      { path: "delivery-locations", element: <AdminDeliveryLocations /> },
    ],
  },
]);
