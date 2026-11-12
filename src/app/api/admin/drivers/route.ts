import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    name?: string;
    zone?: string;
    maxJobsPerDay?: number;
    pin?: string;
  };
  if (!body.name?.trim()) {
    return Response.json({ error: "Name required" }, { status: 400 });
  }
  const pin = body.pin?.replace(/\D/g, "") ?? "";
  if (pin.length < 4) {
    return Response.json({ error: "Give the driver a 4+ digit PIN" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    insert into drivers (name, zone, max_jobs_per_day, pin)
    values (
      ${body.name.trim()},
      ${body.zone?.trim() || "houston"},
      ${body.maxJobsPerDay ?? 8},
      ${pin}
    )
  `;
  await logInteraction({
    actor: "staff",
    action: "driver_added",
    entityType: "driver",
    summary: body.name.trim(),
  });
  return Response.json({ ok: true });
}
