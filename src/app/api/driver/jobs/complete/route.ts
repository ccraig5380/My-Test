import { currentDriver } from "@/lib/driver-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function POST(request: Request) {
  const driver = await currentDriver();
  if (!driver) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { jobId?: string; notes?: string };
  if (!body.jobId) {
    return Response.json({ error: "Missing job" }, { status: 400 });
  }
  const sql = getSql();
  const jobs = (await sql`
    select id, driver_id, completed_at
    from jobs
    where id = ${body.jobId}
    limit 1
  `) as { id: string; driver_id: string | null; completed_at: string | null }[];
  const job = jobs[0];
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.completed_at) {
    return Response.json({ error: "Already completed" }, { status: 409 });
  }
  if (job.driver_id && job.driver_id !== driver.id) {
    return Response.json({ error: "This stop is assigned to someone else" }, { status: 403 });
  }
  await sql`
    update jobs
    set completed_at = now(),
        completed_by_driver_id = ${driver.id},
        driver_id = coalesce(driver_id, ${driver.id}),
        tech_name = coalesce(tech_name, ${driver.name}),
        status = 'completed'
    where id = ${body.jobId}
      and completed_at is null
  `;
  await logInteraction({
    actor: "driver",
    action: "job_completed",
    entityType: "job",
    entityId: body.jobId,
    summary: body.notes?.trim() || `${driver.name} completed stop`,
  });
  return Response.json({ ok: true });
}
