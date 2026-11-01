import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(".env.local", "utf8");
  const line = env.split(/\r?\n/).find((row) => row.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL missing");
  return line.slice("DATABASE_URL=".length).replace(/^"|"$/g, "").trim();
}

const sql = neon(loadDatabaseUrl());
const raw = readFileSync("db/schema.sql", "utf8");
const statements = raw
  .split(/;\s*(?:\r?\n|$)/)
  .map((part) => part.trim())
  .filter((part) => part && !part.startsWith("--"));

for (const statement of statements) {
  await sql.query(statement, []);
}

console.log(`Applied ${statements.length} statements to Neon.`);
