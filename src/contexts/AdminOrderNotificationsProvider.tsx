import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAdminOrders, type AdminOrder } from "@/services/queries/adminQueries";
import { useLanguage } from "./LanguageContext";
import { useAdminTranslations } from "@/locales/admin";
import {
  AdminOrderNotificationsContext,
  type AdminOrderToast,
} from "./AdminOrderNotificationsContext";

function playOrderNotificationSound(): void {
  try {
    const AudioContextConstructor = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
    oscillator.addEventListener("ended", () => {
      void audioContext.close();
    }, { once: true });
  } catch (error) {
    console.warn("Could not play the new-order notification sound.", error);
  }
}

function formatOrderTotal(order: AdminOrder, language: string, quoteRequired: string): string {
  if (order.total == null) return quoteRequired;
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number(order.total));
}

export function AdminOrderNotificationsProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const t = useAdminTranslations();
  const { data: orders } = useAdminOrders();
  const knownOrderIds = useRef<Set<string> | null>(null);
  const [unreadOrderIds, setUnreadOrderIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<AdminOrderToast | null>(null);
  const originalTitle = useRef(document.title);
  const closeToast = useCallback(() => setToast(null), []);
  const markOrdersViewed = useCallback(() => setUnreadOrderIds(new Set()), []);

  useEffect(() => {
    if (!orders) return;

    const currentOrderIds = new Set(orders.map((order) => order.id));
    if (!knownOrderIds.current) {
      knownOrderIds.current = currentOrderIds;
      return;
    }

    const newOrders = orders.filter((order) => !knownOrderIds.current?.has(order.id));
    knownOrderIds.current = currentOrderIds;
    if (newOrders.length === 0) return;

    setUnreadOrderIds((current) => new Set([...current, ...newOrders.map((order) => order.id)]));
    const newOrder = newOrders[0];
    if (!newOrder) return;
    const orderId = `#${newOrder.id.slice(0, 8)}`;
    const total = formatOrderTotal(newOrder, language, t.quoteRequired);
    setToast({
      type: "success",
      message: t.newOrderToast
        .replace("{orderId}", orderId)
        .replace("{total}", total),
    });
    playOrderNotificationSound();
  }, [language, orders, t.newOrderToast, t.quoteRequired]);

  useEffect(() => {
    const titleOnMount = originalTitle.current;
    const unreadCount = unreadOrderIds.size;
    document.title = unreadCount > 0
      ? `(${unreadCount}) ${t.newOrder}`
      : titleOnMount;
    return () => {
      document.title = titleOnMount;
    };
  }, [t.newOrder, unreadOrderIds]);

  return (
    <AdminOrderNotificationsContext.Provider
      value={{
        unreadOrderCount: unreadOrderIds.size,
        toast,
        closeToast,
        markOrdersViewed,
      }}
    >
      {children}
    </AdminOrderNotificationsContext.Provider>
  );
}
