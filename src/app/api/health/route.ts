import { getSql } from "@/lib/db";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { ok: false, database: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const sql = getSql();
    const rows = await sql`select 1 as connected`;
    return Response.json({
      ok: true,
      database: "connected",
      result: rows[0],
    });
  } catch {
    return Response.json({ ok: false, database: "error" }, { status: 500 });
  }
}
