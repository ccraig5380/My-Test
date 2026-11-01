import { isAdmin } from "@/lib/admin-auth";
import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  if (!body.id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    update customers
    set name = coalesce(${body.name ?? null}, name),
        email = coalesce(${body.email ?? null}, email),
        phone = coalesce(${body.phone ?? null}, phone)
    where id = ${body.id}
  `;
  return Response.json({ ok: true });
}
