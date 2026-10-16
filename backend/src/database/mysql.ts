/**
 * MySQL database layer using mysql2/promise.
 *
 * Exposes a thin promise-based API that mirrors the shape expected by the
 * route files after migration:
 *
 *   await db.get<Row>(sql, params)          – first row or undefined
 *   await db.all<Row>(sql, params)          – all rows
 *   await db.run(sql, params)               – { changes, lastInsertRowid }
 *   await db.exec(sql)                      – multi-statement execute
 *   await db.transaction(async fn)          – wraps fn in BEGIN/COMMIT/ROLLBACK
 *   db.columnExists(table, column)          – async, checks INFORMATION_SCHEMA
 */

import mysql, { ExecuteValues, Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";

// ─── Config (from env) ────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export function getMySQLConfig() {
  return {
    host:     process.env.MYSQL_HOST     || "127.0.0.1",
    port:     parseInt(process.env.MYSQL_PORT || "3306", 10),
    user:     requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
  };
}

// ─── Pool ─────────────────────────────────────────────────────────────────

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) throw new Error("MySQL pool not initialised. Call initMySQL() first.");
  return _pool;
}

export async function initMySQL(): Promise<void> {
  const config = getMySQLConfig();
  _pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    // Return dates as strings so they match the TEXT format used by SQLite
    dateStrings:        true,
    // Needed for multi-statement exec()
    multipleStatements: true,
    timezone:           "Z",
  });
  // Verify connectivity
  const conn = await _pool.getConnection();
  conn.release();
  console.log(`✅ MySQL connected to ${config.host}:${config.port}/${config.database}`);
}

export async function closeMySQL(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

// ─── Result helpers ───────────────────────────────────────────────────────

export interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

// ─── Core query helpers ───────────────────────────────────────────────────

/** Run a SELECT and return the first row (or undefined). */
export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: ExecuteValues[] = [],
  conn?: PoolConnection,
): Promise<T | undefined> {
  const executor = conn ?? getPool();
  const [rows] = await executor.execute(sql, params);
  return (rows as T[])[0];
}

/** Run a SELECT and return all rows. */
export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: ExecuteValues[] = [],
  conn?: PoolConnection,
): Promise<T[]> {
  const executor = conn ?? getPool();
  const [rows] = await executor.execute(sql, params);
  return rows as T[];
}

/** Run an INSERT / UPDATE / DELETE. */
export async function dbRun(
  sql: string,
  params: ExecuteValues[] = [],
  conn?: PoolConnection,
): Promise<RunResult> {
  const executor = conn ?? getPool();
  const [result] = await executor.execute(sql, params);
  const hdr = result as ResultSetHeader;
  return { changes: hdr.affectedRows ?? 0, lastInsertRowid: hdr.insertId ?? 0 };
}

/** Execute one or more semicolon-separated DDL/DML statements. */
export async function dbExec(sql: string, conn?: PoolConnection): Promise<void> {
  const executor = conn ?? getPool();
  // Split on semi-colons, skip empty, execute individually to avoid
  // "multipleStatements" security issues while still supporting batches.
  const statements = sql
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await executor.query(stmt);
  }
}

/** Wrap an async function in a database transaction. */
export async function dbTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Schema inspection helpers ────────────────────────────────────────────

/** Check whether a column exists in the given table (via INFORMATION_SCHEMA). */
export async function columnExists(table: string, column: string): Promise<boolean> {
  const database = process.env.MYSQL_DATABASE!;
  const row = await dbGet<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column],
  );
  return (row?.cnt ?? 0) > 0;
}

/** Add a column if it doesn't already exist (idempotent). */
export async function addColumnIfMissing(
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const exists = await columnExists(table, column);
  if (!exists) {
    await dbExec(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`🛠️  Migration: Added '${column}' column to ${table} table`);
  }
}
