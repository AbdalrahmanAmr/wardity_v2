import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwt.js";
import { dbGet } from "../database/mysql.js";

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      message: "Authentication required",
      status: 401,
    });
    return;
  }

  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      name: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(403).json({
      message: "Invalid or expired token",
      status: 403,
    });
  }
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(403).json({
      message: "Admin access required",
      status: 403,
    });
    return;
  }

  const user = await dbGet<{ role: string }>(
    "SELECT role FROM users WHERE id = ?",
    [req.userId],
  );
  if (user?.role !== "admin") {
    res.status(403).json({
      message: "Admin access required",
      status: 403,
    });
    return;
  }
  next();
}
