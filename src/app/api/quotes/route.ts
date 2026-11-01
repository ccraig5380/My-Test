import { isCoveredZip } from "@/lib/business";
import { ensureSchema, getSql } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();
  const zip = body.zip?.replace(/\D/g, "").slice(0, 5);
  const propertyType = body.propertyType?.trim();
  const notes = body.notes?.trim() ?? "";
  const acreageExact = Number(body.acreageExact);

  if (!name || !email || !phone || !address || !zip || !propertyType) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  if (Number.isNaN(acreageExact) || acreageExact < 5) {
    return Response.json(
      { error: "Enter acreage of 5 or more" },
      { status: 400 },
    );
  }

  await ensureSchema();
  const sql = getSql();
  await sql`
    insert into quote_requests (
      name, email, phone, address_line, zip, property_type, acreage_exact, notes
    ) values (
      ${name}, ${email}, ${phone}, ${address}, ${zip}, ${propertyType},
      ${acreageExact}, ${notes}
    )
  `;

  return Response.json({
    ok: true,
    covered: isCoveredZip(zip),
    message: "We will contact you with a quote.",
  });
}
