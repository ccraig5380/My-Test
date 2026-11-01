import { isAdmin } from "@/lib/admin-auth";
import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    name?: string;
    zone?: string;
    maxJobsPerDay?: number;
  };
  if (!body.name?.trim()) {
    return Response.json({ error: "Name required" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    insert into drivers (name, zone, max_jobs_per_day)
    values (
      ${body.name.trim()},
      ${body.zone?.trim() || "houston"},
      ${body.maxJobsPerDay ?? 8}
    )
  `;
  return Response.json({ ok: true });
}
