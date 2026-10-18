function getIntegerEnv(name: string, fallback: number, minimum = 1): number {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}`);
  }
  return value;
}

function getCsvEnv(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const runtimeConfig = {
  port: getIntegerEnv("PORT", 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseDriver: (process.env.DB_DRIVER || "").toLowerCase(),
  corsOrigins: getCsvEnv("CORS_ORIGIN"),
  developmentCorsOrigins: getCsvEnv("DEV_CORS_ORIGINS"),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "100kb",
  defaultProductPageSize: getIntegerEnv("PRODUCTS_DEFAULT_PAGE_SIZE", 20),
  mysqlHost: process.env.MYSQL_HOST || "127.0.0.1",
  mysqlPort: getIntegerEnv("MYSQL_PORT", 3306),
  mysqlConnectionLimit: getIntegerEnv("MYSQL_CONNECTION_LIMIT", 10),
  mysqlQueueLimit: getIntegerEnv("MYSQL_QUEUE_LIMIT", 0, 0),
  mysqlTimezone: process.env.MYSQL_TIMEZONE || "Z",
  orderNotificationTimeoutMs: getIntegerEnv("ORDER_NOTIFICATION_TIMEOUT_MS", 5000),
  metaCapiTimeoutMs: getIntegerEnv("META_CAPI_TIMEOUT_MS", 3000),
};
