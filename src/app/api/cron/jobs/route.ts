import { getSql } from "@/lib/db";
import { ensureNextRouteJobs } from "@/lib/zip-routing";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const fromVercel = request.headers.get("x-vercel-cron") === "1";
  if (!fromVercel && (!secret || auth !== `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const created = await ensureNextRouteJobs();

  const due = (await sql`
    select j.id, c.email, c.name, j.starts_at
    from jobs j
    join customers c on c.id = j.customer_id
    where j.status = 'scheduled'
      and j.reminder_sent_at is null
      and j.starts_at > now()
      and j.starts_at < now() + interval '24 hours'
  `) as { id: string; email: string; name: string; starts_at: string }[];

  const resendKey = process.env.RESEND_API_KEY;
  let reminded = 0;
  if (resendKey) {
    for (const job of due) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "reminders@example.com",
          to: job.email,
          subject: "Mosquito treatment tomorrow",
          text: `Hi ${job.name}, your visit is ${job.starts_at}.`,
        }),
      });
      await sql`update jobs set reminder_sent_at = now() where id = ${job.id}`;
      reminded += 1;
    }
  }

  return Response.json({ created, reminded });
}
