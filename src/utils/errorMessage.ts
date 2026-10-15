import type { ApiError } from "@/types";

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as ApiError).message;
    if (typeof message === "string" && message) return message;
  }
  return "Something went wrong. Please try again.";
}
