import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

export async function logInteraction(input: {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
}) {
  const sql = getSql();
  await sql`
    insert into interactions (actor, action, entity_type, entity_id, summary)
    values (
      ${input.actor},
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${input.summary ?? null}
    )
  `;
}
