import { ensureSchema, getSql } from "@/lib/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const fromVercel = request.headers.get("x-vercel-cron") === "1";
  if (!fromVercel && (!secret || auth !== `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const sql = getSql();
  const subs = (await sql`
    select s.id, s.customer_id, s.property_id, p.acreage_band
    from subscriptions s
    join properties p on p.id = s.property_id
    where s.status = 'active'
  `) as {
    id: string;
    customer_id: string;
    property_id: string;
    acreage_band: string;
  }[];

  let created = 0;
  for (const sub of subs) {
    const last = (await sql`
      select starts_at, ends_at from jobs
      where subscription_id = ${sub.id}
      order by starts_at desc
      limit 1
    `) as { starts_at: string; ends_at: string }[];
    if (!last[0]?.starts_at) continue;
    const nextStart = new Date(last[0].starts_at);
    nextStart.setUTCMonth(nextStart.getUTCMonth() + 1);
    const nextEnd = new Date(last[0].ends_at);
    nextEnd.setUTCMonth(nextEnd.getUTCMonth() + 1);
    const exists = (await sql`
      select id from jobs
      where subscription_id = ${sub.id}
        and starts_at = ${nextStart.toISOString()}
      limit 1
    `) as { id: string }[];
    if (exists[0]) continue;
    await sql`
      insert into jobs (
        customer_id, property_id, subscription_id, starts_at, ends_at, status
      ) values (
        ${sub.customer_id}, ${sub.property_id}, ${sub.id},
        ${nextStart.toISOString()}, ${nextEnd.toISOString()}, 'scheduled'
      )
    `;
    created += 1;
  }

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
