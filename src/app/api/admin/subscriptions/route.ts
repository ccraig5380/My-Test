import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: string;
    action?: "cancel" | "recurring";
  };
  if (!body.id || !body.action) {
    return Response.json({ error: "Missing id or action" }, { status: 400 });
  }
  const sql = getSql();
  if (body.action === "cancel") {
    await sql`
      update subscriptions
      set cancelled_at = now(), status = 'cancelled'
      where id = ${body.id}
    `;
    await logInteraction({
      actor: "staff",
      action: "subscription_cancelled",
      entityType: "subscription",
      entityId: body.id,
    });
    return Response.json({ ok: true });
  }
  await sql`
    update subscriptions
    set plan_type = 'recurring',
        ends_on = null,
        cancelled_at = null,
        status = case when status = 'cancelled' then 'active' else status end
    where id = ${body.id}
  `;
  await logInteraction({
    actor: "staff",
    action: "converted_to_recurring",
    entityType: "subscription",
    entityId: body.id,
  });
  return Response.json({ ok: true });
}
