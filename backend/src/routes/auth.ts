import { Router, Response } from "express";
import { db } from "../database/init.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { validate, registerSchema, loginSchema } from "../utils/validation.js";
import { generateId } from "../utils/id.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post("/register", async (req, res: Response) => {
  const { email, password, name } = validate(registerSchema, req.body);

  // Check if user already exists
  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;

  if (existingUser) {
    res.status(409).json({
      message: "User with this email already exists",
      status: 409,
    });
    return;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = generateId();
  const role = "customer";
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, email, name, passwordHash, role);

  // Generate token
  const token = generateToken({ userId, email, name, role });

  res.status(201).json({
    data: {
      user: {
        id: userId,
        email,
        name,
      },
      token,
    },
    message: "User registered successfully",
    status: 201,
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
authRouter.post("/login", async (req, res: Response) => {
  const { email, password } = validate(loginSchema, req.body);

  // Find user
  const user = db
    .prepare("SELECT id, email, name, password_hash, role FROM users WHERE email = ?")
    .get(email) as
    | {
        id: string;
        email: string;
        name: string;
        password_hash: string;
        role: string;
      }
    | undefined;

  if (!user) {
    res.status(401).json({
      message: "Invalid email or password",
      status: 401,
    });
    return;
  }

  // Verify password
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({
      message: "Invalid email or password",
      status: 401,
    });
    return;
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    },
    message: "Login successful",
    status: 200,
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
authRouter.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db
    .prepare("SELECT id, email, name, phone, role FROM users WHERE id = ?")
    .get(req.userId) as
    | {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
      }
    | undefined;

  if (!user) {
    res.status(404).json({
      message: "User not found",
      status: 404,
    });
    return;
  }

  res.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      role: user.role,
    },
    message: "User profile retrieved successfully",
    status: 200,
  });
});

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
authRouter.patch(
  "/profile",
  authenticateToken,
  (req: AuthRequest, res: Response) => {
    const { name, phone } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length === 0) {
      res.status(400).json({
        message: "No fields to update",
        status: 400,
      });
      return;
    }

    updates.push("updated_at = datetime('now')");
    values.push(req.userId);

    db.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).run(...values);

    const updatedUser = db
      .prepare("SELECT id, email, name, phone FROM users WHERE id = ?")
      .get(req.userId) as {
      id: string;
      email: string;
      name: string;
      phone: string | null;
    };

    res.json({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone || undefined,
      },
      message: "Profile updated successfully",
      status: 200,
    });
  }
);
