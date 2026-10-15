import { FC, Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header, Footer } from "@/components/layout";
import { ChatWidget } from "@/components/features";
import { PageLoadingSpinner, ScrollToTop } from "@/components/ui";
import { useDarkMode } from "@/hooks/useDarkMode";
import { trackPageView } from "@/lib/tracking";
import { useConsent } from "@/contexts/ConsentContext";

export const RootLayout: FC = () => {
  // Initialize dark mode on mount
  useDarkMode();
  const location = useLocation();
  const { choice } = useConsent();
  const firstPath = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || choice !== "accepted") return;
    const path = `${location.pathname}${location.search}`;
    if (firstPath.current === path) return;
    firstPath.current = path;
    trackPageView(path);
  }, [choice, location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col bg-wardity-bg dark:bg-wardity-bg-dark">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};
