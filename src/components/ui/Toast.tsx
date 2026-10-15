import { FC } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export const Toast: FC<ToastProps> = ({ message, type, onClose }) => (
  <div
    role="alert"
    className={`fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`}
  >
    <span>{message}</span>
    <button type="button" onClick={onClose} aria-label="Close notification">
      &times;
    </button>
  </div>
);
