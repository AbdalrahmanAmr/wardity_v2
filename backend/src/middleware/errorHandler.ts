import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface ApiError extends Error {
  code?: number;
  details?: Record<string, string[]>;
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errors = err.flatten().fieldErrors;
    res.status(400).json({
      message: "Please correct the highlighted fields.",
      errors,
      status: 400,
    });
    return;
  }

  const candidateStatus = err.statusCode ?? err.status ?? err.code;
  const code = typeof candidateStatus === "number" && candidateStatus >= 400 && candidateStatus < 500
    ? candidateStatus
    : 500;
  const message = code === 500 ? "Internal server error" : (err.message || "Request failed");

  console.error("Error:", err);

  res.status(code).json({
    message,
    errors: code === 500 ? undefined : err.details,
    status: code,
  });
}

