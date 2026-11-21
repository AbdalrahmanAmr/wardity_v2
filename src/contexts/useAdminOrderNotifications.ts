import { useContext } from "react";
import {
  AdminOrderNotificationsContext,
  type AdminOrderNotificationsContextValue,
} from "./AdminOrderNotificationsContext";

export function useAdminOrderNotifications(): AdminOrderNotificationsContextValue {
  const context = useContext(AdminOrderNotificationsContext);
  if (!context) {
    throw new Error("useAdminOrderNotifications must be used within AdminOrderNotificationsProvider");
  }
  return context;
}
