import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logError } from "../utils/errorLogger.js";

export interface ApiError extends Error {
  code?: number;
  details?: Record<string, string[]>;
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as SyntaxError & { status?: number }).status === 400
  ) {
    res.status(400).json({
      message: "Invalid JSON request body.",
      status: 400,
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.flatten().fieldErrors;
    logError(err, {
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        query: req.query,
        params: req.params,
        body: req.body,
        headers: req.headers,
      },
      statusCode: 400,
    });
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

  logError(err, {
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      query: req.query,
      params: req.params,
      body: req.body,
      headers: req.headers,
      userAgent: req.get("user-agent"),
    },
    statusCode: code,
  });

  res.status(code).json({
    message,
    errors: code === 500 ? undefined : err.details,
    status: code,
  });
}

