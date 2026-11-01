import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: string;
    status?: string;
    techName?: string;
  };
  if (!body.id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    update jobs
    set status = coalesce(${body.status ?? null}, status),
        tech_name = coalesce(${body.techName ?? null}, tech_name)
    where id = ${body.id}
  `;
  await logInteraction({
    actor: "staff",
    action: "job_updated",
    entityType: "job",
    entityId: body.id,
    summary: body.status ?? "updated",
  });
  return Response.json({ ok: true });
}
