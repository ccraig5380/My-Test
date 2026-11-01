import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    authorName?: string;
    location?: string;
    quote?: string;
    rating?: number;
    published?: boolean;
  };
  const authorName = body.authorName?.trim();
  const quote = body.quote?.trim();
  const rating = Number(body.rating ?? 5);
  if (!authorName || !quote) {
    return Response.json({ error: "Name and review are required" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    insert into reviews (author_name, location, body, rating, published)
    values (
      ${authorName},
      ${body.location?.trim() || null},
      ${quote},
      ${rating},
      ${body.published ?? true}
    )
  `;
  await logInteraction({
    actor: "staff",
    action: "review_added",
    entityType: "review",
    summary: authorName,
  });
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { id?: string; published?: boolean };
  if (!body.id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    update reviews set published = ${body.published ?? false} where id = ${body.id}
  `;
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const sql = getSql();
  await sql`delete from reviews where id = ${id}`;
  await logInteraction({
    actor: "staff",
    action: "review_deleted",
    entityType: "review",
    entityId: id,
  });
  return Response.json({ ok: true });
}
