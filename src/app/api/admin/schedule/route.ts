import { isAdmin } from "@/lib/admin-auth";
import { autoDispatchEnabled, autoSuggestDriver, zoneForZip } from "@/lib/dispatch";
import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    jobId?: string;
    startsAt?: string;
    driverId?: string;
    techName?: string;
  };
  if (!body.jobId || !body.startsAt) {
    return Response.json({ error: "Job and start time required" }, { status: 400 });
  }
  const sql = getSql();
  const start = new Date(body.startsAt);
  if (Number.isNaN(start.getTime())) {
    return Response.json({ error: "Invalid start time" }, { status: 400 });
  }
  const end = new Date(start.getTime() + 45 * 60000);
  let driverId = body.driverId || null;

  if (!driverId && autoDispatchEnabled) {
    const job = (await sql`
      select p.zip from jobs j
      join properties p on p.id = j.property_id
      where j.id = ${body.jobId}
      limit 1
    `) as { zip: string }[];
    const day = start.toISOString().slice(0, 10);
    const drivers = (await sql`
      select d.id, d.name, d.zone, d.max_jobs_per_day,
        (
          select count(*)::int from jobs j
          where j.driver_id = d.id
            and j.starts_at::date = ${day}::date
        ) as jobs_today
      from drivers d
      where d.active = true
    `) as {
      id: string;
      name: string;
      zone: string;
      max_jobs_per_day: number;
      jobs_today: number;
    }[];
    const pick = autoSuggestDriver(
      zoneForZip(job[0]?.zip ?? ""),
      drivers.map((d) => ({ ...d, jobsToday: d.jobs_today })),
    );
    driverId = pick?.id ?? null;
  }

  await sql`
    update jobs
    set starts_at = ${start.toISOString()},
        ends_at = ${end.toISOString()},
        driver_id = ${driverId},
        tech_name = ${body.techName ?? null},
        status = 'scheduled'
    where id = ${body.jobId}
  `;
  return Response.json({ ok: true });
}
