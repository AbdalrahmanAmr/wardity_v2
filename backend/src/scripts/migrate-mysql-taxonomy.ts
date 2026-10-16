/**
 * Explicit one-time legacy-data migration for databases imported from SQLite.
 *
 * This is intentionally separate from server startup. Review its effects and
 * invoke it manually only when the taxonomy/product conversion is desired.
 */

import { closeMySQL, initMySQL } from "../database/mysql.js";
import {
  migrateLegacyProductAssignmentsMySQL,
  synchronizeTaxonomyMySQL,
} from "../database/init-mysql.js";

if (!process.argv.includes("--apply")) {
  throw new Error("Refusing to change data. Re-run with --apply after reviewing the migration.");
}

await initMySQL();
try {
  await synchronizeTaxonomyMySQL("categories");
  await synchronizeTaxonomyMySQL("occasions");
  await migrateLegacyProductAssignmentsMySQL();
} finally {
  await closeMySQL();
}
