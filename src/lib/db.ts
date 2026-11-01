import { neon } from "@neondatabase/serverless";
import { schemaStatements } from "@/lib/schema";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

let migrated = false;

export async function ensureSchema() {
  if (migrated) return;
  const sql = getSql();
  for (const statement of schemaStatements) {
    await sql.query(statement, []);
  }
  migrated = true;
}
