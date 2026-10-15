import { existsSync, unlinkSync } from "fs";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = resolve(__dirname, "../..");

export const UPLOADS_DIR = resolve(
  backendDir,
  process.env.UPLOADS_DIR || "uploads",
);

export function isLocalUploadUrl(value: unknown): value is string {
  return typeof value === "string" && value.includes("/uploads/");
}

export function deleteUploadIfUnreferenced(url: unknown): void {
  if (!isLocalUploadUrl(url)) return;

  const filename = basename(new URL(url, "http://localhost").pathname);
  const filePath = resolve(UPLOADS_DIR, filename);
  if (dirname(filePath) !== resolve(UPLOADS_DIR)) return;
  if (existsSync(filePath)) unlinkSync(filePath);
}
