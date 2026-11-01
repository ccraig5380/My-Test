import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const sql = getSql();
  await sql`update quote_requests set status = ${body.status} where id = ${body.id}`;
  await logInteraction({
    actor: "staff",
    action: "quote_status",
    entityType: "quote_request",
    entityId: body.id,
    summary: body.status,
  });
  return Response.json({ ok: true });
}
