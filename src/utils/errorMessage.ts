import type { ApiError } from "@/types";

function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === "object");
}

function humanizeField(field: string): string {
  const labels: Record<string, string> = {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirmed password",
    name: "Name",
    phone: "Phone number",
    deliveryLocationId: "Delivery location",
    requestedDeliveryDate: "Delivery date",
    shippingAddress: "Shipping address",
    price: "Price",
    salePrice: "Sale price",
    quantity: "Quantity",
  };

  const label = labels[field];
  if (label) return label;
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function getErrorMessage(
  error: unknown,
  fallback = "We could not complete that request. Please check your details and try again.",
): string {
  if (!isApiError(error)) {
    if (error instanceof Error && error.message) {
      return error.message === "Failed to fetch"
        ? "We could not reach the server. Check your internet connection and try again."
        : fallback;
    }
    return fallback;
  }

  const apiError = error as ApiError;
  if (apiError.details && typeof apiError.details === "object") {
    const entries = Object.entries(apiError.details);
    for (const [field, messages] of entries) {
      if (Array.isArray(messages) && messages.length > 0) {
        return `${humanizeField(field)}: ${messages[0]}`;
      }
    }
  }

  const code = apiError.code;
  if (code === 0) {
    return "We could not reach the server. Check your internet connection and try again.";
  }

  const message =
    typeof apiError.message === "string" ? apiError.message.trim() : "";
  const normalized = message.toLowerCase();

  if (code === 400 || normalized.includes("highlighted fields")) {
    return "Please check the highlighted fields and correct any information that is missing or invalid.";
  }
  if (code === 401 || normalized.includes("invalid email or password")) {
    return "We could not sign you in. Check your email and password, then try again.";
  }
  if (code === 403 || normalized.includes("forbidden")) {
    return "You do not have permission to complete this action.";
  }
  if (code === 404) {
    return "The requested information could not be found.";
  }
  if (code === 409 || normalized.includes("already exists")) {
    return "An account with this email already exists. Sign in or use a different email.";
  }
  if (code === 429 || normalized.includes("too many")) {
    return "Too many attempts. Wait a moment before trying again.";
  }
  if (code === 500 || code === 502 || code === 503 || code >= 500) {
    return "The server is temporarily unavailable. Please try again shortly.";
  }
  if (normalized === "network error. please check your connection.") {
    return "We could not reach the server. Check your internet connection and try again.";
  }

  if (
    message &&
    !/^internal server error$/i.test(message) &&
    !/^request failed/i.test(message)
  ) {
    return message;
  }

  return fallback;
}
