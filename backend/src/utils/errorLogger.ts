import {
  appendFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const MAX_LOG_AGE_DAYS = 30;
const MAX_LOG_FILES = 3;
const MAX_LOG_FILE_BYTES = 10 * 1024 * 1024;
const LOG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "logs");

const sensitiveKeys = [
  "authorization",
  "cookie",
  "password",
  "token",
  "secret",
  "api_key",
];

function sanitize(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (depth > 6) return "[Maximum depth reached]";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause === undefined ? {} : { cause: sanitize(value.cause, seen, depth + 1) }),
      ...Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, sanitize(nested, seen, depth + 1)]),
      ),
    };
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    result[key] = sensitiveKeys.some((sensitive) =>
      normalizedKey === sensitive ||
      normalizedKey.includes(sensitive)
    )
      ? "[REDACTED]"
      : sanitize(nested, seen, depth + 1);
  }
  return result;
}

function cleanupLogs(): void {
  mkdirSync(LOG_DIR, { recursive: true });

  const cutoff = Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;
  let files = readdirSync(LOG_DIR)
    .filter((name) => /^error-\d{4}-\d{2}-\d{2}(?:-\d{3})?\.log$/.test(name))
    .map((name) => {
      const path = join(LOG_DIR, name);
      return { name, path, mtimeMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const file of files) {
    if (file.mtimeMs < cutoff) {
      unlinkSync(file.path);
    }
  }

  files = readdirSync(LOG_DIR)
    .filter((name) => /^error-\d{4}-\d{2}-\d{2}(?:-\d{3})?\.log$/.test(name))
    .map((name) => {
      const path = join(LOG_DIR, name);
      return { name, path, mtimeMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const file of files.slice(MAX_LOG_FILES)) {
    unlinkSync(file.path);
  }
}

function getLogPath(): string {
  mkdirSync(LOG_DIR, { recursive: true });
  cleanupLogs();

  const date = new Date().toISOString().slice(0, 10);
  const existing = readdirSync(LOG_DIR)
    .filter((name) => name.startsWith(`error-${date}`) && name.endsWith(".log"))
    .sort();

  for (const name of existing) {
    const path = join(LOG_DIR, name);
    if (statSync(path).size < MAX_LOG_FILE_BYTES) return path;
  }

  const sequence = existing.length + 1;
  return join(LOG_DIR, `error-${date}-${String(sequence).padStart(3, "0")}.log`);
}

export function logError(context: unknown, details: Record<string, unknown> = {}): void {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      pid: process.pid,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? "development",
      context: sanitize(context),
      details: sanitize(details),
    };

    appendFileSync(getLogPath(), `${JSON.stringify(entry)}\n`, { encoding: "utf8" });
    cleanupLogs();
  } catch (loggerError) {
    const message = loggerError instanceof Error ? loggerError.message : String(loggerError);
    process.stderr.write(`Unable to write application error log: ${message}\n`);
  }
}

export function installGlobalErrorLogging(): void {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    logError(args.length === 1 ? args[0] : args);
    originalConsoleError(...args);
  };

  process.on("uncaughtException", (error, origin) => {
    logError(error, { event: "uncaughtException", origin });
  });

  process.on("unhandledRejection", (reason) => {
    logError(reason, { event: "unhandledRejection" });
  });
}
