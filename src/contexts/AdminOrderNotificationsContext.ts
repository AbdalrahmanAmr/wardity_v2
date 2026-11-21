import { createContext } from "react";

export interface AdminOrderToast {
  message: string;
  type: "success";
}

export interface AdminOrderNotificationsContextValue {
  unreadOrderCount: number;
  toast: AdminOrderToast | null;
  closeToast: () => void;
  markOrdersViewed: () => void;
}

export const AdminOrderNotificationsContext = createContext<AdminOrderNotificationsContextValue | undefined>(undefined);
