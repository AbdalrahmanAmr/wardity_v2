import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

const INSECURE_JWT_SECRETS = new Set([
  "your-super-secret-jwt-key-change-this-in-production",
  "your-super-secret-jwt-key-change-in-production",
  "<unique random secret, at least 32 bytes>",
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes long");
  }
  if (INSECURE_JWT_SECRETS.has(secret)) {
    throw new Error("JWT_SECRET must not use the documented placeholder value");
  }
  return secret;
}

export function validateJwtSecret(): void {
  getJwtSecret();
}

export function generateToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
}
