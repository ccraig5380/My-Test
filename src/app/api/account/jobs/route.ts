import { ensureSchema, getSql } from "@/lib/db";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }
  await ensureSchema();
  const sql = getSql();
  const jobs = await sql`
    select j.id, j.starts_at, j.status, c.stripe_customer_id
    from jobs j
    join customers c on c.id = j.customer_id
    where lower(c.email) = lower(${email})
    order by j.starts_at asc
  `;
  return Response.json({ jobs });
}
