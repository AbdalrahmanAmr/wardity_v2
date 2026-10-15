import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-change-in-production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET || "fallback-secret-change-in-production";
  return jwt.verify(token, secret) as TokenPayload;
}
