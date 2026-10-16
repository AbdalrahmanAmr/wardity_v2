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
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./index.css";

// Initialize dark mode before React renders to prevent flash
let storedTheme: string | null = null;
try { storedTheme = localStorage.getItem("wardity-theme"); } catch { /* Use the operating-system preference when storage is unavailable. */ }
const themeValue = storedTheme ? (() => { try { return JSON.parse(storedTheme); } catch { return storedTheme; } })() : "system";
const theme = themeValue === "dark" || themeValue === "light" || themeValue === "system" ? themeValue : "system";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (theme === "dark" || (theme === "system" && systemDark)) {
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
        <ThemeProvider><LanguageProvider>
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
        </LanguageProvider></ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
