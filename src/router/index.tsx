import { createBrowserRouter, Link } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import {
  Home,
  Product,
  NotFound,
  Cart,
  Login,
  Register,
  Search,
  Checkout,
  Categories,
  CategoryDetail,
  Occasions,
  OccasionDetail,
  Brands,
  SpecialGifts,
  CollectionDetail,
  BestSellers,
  Wishlist,
  Profile,
  Orders,
  OrderTracking,
  Contact,
  FAQs,
  Delivery,
  TrackOrder,
  About,
  Privacy,
  Terms,
  AdminDashboard,
  AdminProducts,
  AdminOrders,
  AdminCategories,
  AdminOccasions,
  AdminUsers,
} from "@/pages";
import { categoryLoader, occasionLoader } from "./loaders";

const ProductError = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-wardity-bg dark:bg-wardity-bg-dark py-16 px-4">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Product Not Found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The product you are looking for does not exist, has been removed, or could not be loaded.
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
        path: "faqs",
        element: <FAQs />,
      },
      {
        path: "delivery",
        element: <Delivery />,
      },
      {
        path: "track-order",
        element: <TrackOrder />,
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
    ],
  },
]);
