/**
 * MySQL-compatible version of routes/auth.ts
 *
 * Key changes:
 *  - All handlers async
 *  - datetime('now') → NOW()
 *  - db.prepare().get/run() → await dbGet/dbRun()
 */

import { Router, Response } from "express";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { validate, registerSchema, loginSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { dbGet, dbRun } from "../database/mysql.js";
import type { ExecuteValues } from "mysql2/promise";

export const authRouterMySQL = Router();

// ── POST /api/auth/register ────────────────────────────────────────────────
authRouterMySQL.post("/register", async (req, res: Response) => {
  const { email, password, name } = validate(registerSchema, req.body);

  const existingUser = await dbGet<{ id: string }>(
    "SELECT id FROM users WHERE email = ?", [email],
  );
  if (existingUser) {
    res.status(409).json({ message: "User with this email already exists", status: 409 });
    return;
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();
  const role = "customer";
  await dbRun(
    "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [userId, email, name, passwordHash, role],
  );

  const token = generateToken({ userId, email, name, role });
  res.status(201).json({
    data: { user: { id: userId, email, name }, token },
    message: "User registered successfully",
    status: 201,
  });
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
authRouterMySQL.post("/login", async (req, res: Response) => {
  const { email, password } = validate(loginSchema, req.body);

  const user = await dbGet<{
    id: string; email: string; name: string; password_hash: string; role: string;
  }>(
    "SELECT id, email, name, password_hash, role FROM users WHERE email = ?", [email],
  );
  if (!user) {
    res.status(401).json({ message: "Invalid email or password", status: 401 });
    return;
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ message: "Invalid email or password", status: 401 });
    return;
  }

  const token = generateToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  res.json({
    data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token },
    message: "Login successful",
    status: 200,
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
authRouterMySQL.get("/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required", status: 401 });
    return;
  }
  const user = await dbGet<{ id: string; email: string; name: string; phone: string | null; role: string }>(
    "SELECT id, email, name, phone, role FROM users WHERE id = ?", [req.userId],
  );
  if (!user) {
    res.status(404).json({ message: "User not found", status: 404 });
    return;
  }
  res.json({
    data: { id: user.id, email: user.email, name: user.name, phone: user.phone || undefined, role: user.role },
    message: "User profile retrieved successfully",
    status: 200,
  });
});

// ── PATCH /api/auth/profile ────────────────────────────────────────────────
authRouterMySQL.patch("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const updates: string[] = [];
  const values: ExecuteValues[] = [];

  if (name !== undefined) {
    if (typeof name !== "string") {
      res.status(400).json({ message: "Name must be a string", status: 400 });
      return;
    }
    updates.push("name = ?");
    values.push(name);
  }
  if (phone !== undefined) {
    if (phone !== null && typeof phone !== "string") {
      res.status(400).json({ message: "Phone must be a string or null", status: 400 });
      return;
    }
    updates.push("phone = ?");
    values.push(phone);
  }

  if (updates.length === 0) {
    res.status(400).json({ message: "No fields to update", status: 400 });
    return;
  }

  if (!req.userId) {
    res.status(401).json({ message: "Authentication required", status: 401 });
    return;
  }
  updates.push("updated_at = NOW()");
  values.push(req.userId);

  await dbRun(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

  const updatedUser = await dbGet<{ id: string; email: string; name: string; phone: string | null }>(
    "SELECT id, email, name, phone FROM users WHERE id = ?", [req.userId],
  );
  res.json({
    data: {
      id: updatedUser!.id, email: updatedUser!.email,
      name: updatedUser!.name, phone: updatedUser!.phone || undefined,
    },
    message: "Profile updated successfully",
    status: 200,
  });
});
