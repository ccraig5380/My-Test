import { isAdmin } from "@/lib/admin-auth";
import { getSql, logInteraction } from "@/lib/db";

const kinds = new Set(["percent", "fixed"]);
const seasons = new Set(["year_round", "winter", "summer"]);
const visitOptions = new Set([1, 2, 3, 6, 12]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    code?: string;
    discountKind?: string;
    discountValue?: number;
    useLimitKind?: string;
    maxRedemptions?: number;
    expiresAt?: string;
    durationVisits?: string | number | null;
    season?: string;
  };
  const code = body.code?.trim().toUpperCase().replace(/\s+/g, "");
  const discountKind = body.discountKind?.trim();
  const season = body.season?.trim() ?? "year_round";
  const expiresAt = body.expiresAt?.trim();
  const amount = Number(body.discountValue);
  if (!code || !discountKind || !kinds.has(discountKind) || !expiresAt) {
    return Response.json({ error: "Code, discount, and expiration are required" }, { status: 400 });
  }
  if (!seasons.has(season)) {
    return Response.json({ error: "Invalid season" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Enter a discount amount greater than 0" }, { status: 400 });
  }
  if (discountKind === "percent" && amount > 100) {
    return Response.json({ error: "Percent off must be 100 or less" }, { status: 400 });
  }
  let maxRedemptions: number | null = null;
  if (body.useLimitKind !== "unlimited") {
    const count = Number(body.maxRedemptions);
    if (!Number.isInteger(count) || count < 1) {
      return Response.json({ error: "Enter a whole number of uses" }, { status: 400 });
    }
    maxRedemptions = count;
  }
  let durationVisits: number | null = null;
  if (body.durationVisits !== "" && body.durationVisits != null) {
    const visits = Number(body.durationVisits);
    if (!visitOptions.has(visits)) {
      return Response.json({ error: "Invalid visit duration" }, { status: 400 });
    }
    durationVisits = visits;
  }
  const sql = getSql();
  try {
    await sql`
      insert into promo_codes (
        code, discount_kind, discount_value, max_redemptions,
        expires_at, duration_visits, season
      )
      values (
        ${code},
        ${discountKind},
        ${amount},
        ${maxRedemptions},
        ${expiresAt},
        ${durationVisits},
        ${season}
      )
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique") || message.includes("23505")) {
      return Response.json({ error: "That promo code already exists" }, { status: 409 });
    }
    throw error;
  }
  await logInteraction({
    actor: "staff",
    action: "promo_created",
    entityType: "promo_code",
    summary: code,
  });
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { id?: string; active?: boolean };
  if (!body.id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const sql = getSql();
  await sql`
    update promo_codes set active = ${body.active ?? false} where id = ${body.id}
  `;
  await logInteraction({
    actor: "staff",
    action: body.active ? "promo_activated" : "promo_deactivated",
    entityType: "promo_code",
    entityId: body.id,
  });
  return Response.json({ ok: true });
}
