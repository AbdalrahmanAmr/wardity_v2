import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui";
import {
  CartProvider,
  AuthProvider,
  WishlistProvider,
  LanguageProvider,
  DeliveryLocationProvider,
  ConsentProvider,
} from "@/contexts";
import { queryClient } from "./services/queryClient";
import { router } from "./router";
import "./index.css";

// Initialize dark mode before React renders to prevent flash
const theme = localStorage.getItem("wardity-theme") || "light";
if (theme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <DeliveryLocationProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ConsentProvider>
                    <RouterProvider router={router} />
                  </ConsentProvider>
                  <ReactQueryDevtools initialIsOpen={false} />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </DeliveryLocationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
