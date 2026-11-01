import { assertBookable } from "@/lib/availability";
import {
  isCoveredZip,
  type PropertyTypeId,
} from "@/lib/business";
import { getSql, logInteraction } from "@/lib/db";
import { getStripe, priceFor } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();
  const zip = body.zip?.replace(/\D/g, "").slice(0, 5);
  const propertyType = body.propertyType as PropertyTypeId;
  const band = body.acreageBand;
  const preferredDays = body.preferredDays?.trim() ?? "";

  if (!name || !email || !phone || !address || !zip) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    assertBookable(propertyType, band);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid plan";
    return Response.json({ error: message }, { status: 400 });
  }
  if (!isCoveredZip(zip)) {
    return Response.json(
      { error: "That ZIP is outside the published service area." },
      { status: 400 },
    );
  }

  const sql = getSql();
  const origin = new URL(request.url).origin;

  const existing = (await sql`
    select id from customers where lower(email) = lower(${email}) limit 1
  `) as { id: string }[];

  let customerId = existing[0]?.id;
  if (!customerId) {
    const created = (await sql`
      insert into customers (name, email, phone)
      values (${name}, ${email}, ${phone})
      returning id
    `) as { id: string }[];
    customerId = created[0].id;
  }

  const property = (await sql`
    insert into properties (
      customer_id, property_type, acreage_band, address_line, zip, preferred_days
    ) values (
      ${customerId}, ${propertyType}, ${band}, ${address}, ${zip}, ${preferredDays}
    ) returning id
  `) as { id: string }[];

  if (!process.env.STRIPE_SECRET_KEY) {
    const sub = (await sql`
      insert into subscriptions (customer_id, property_id, status)
      values (${customerId}, ${property[0].id}, 'pending_payment')
      returning id
    `) as { id: string }[];
    await sql`
      insert into jobs (customer_id, property_id, subscription_id, status)
      values (${customerId}, ${property[0].id}, ${sub[0].id}, 'needs_schedule')
    `;
    await logInteraction({
      actor: "customer",
      action: "service_request",
      entityType: "customer",
      entityId: customerId,
      summary: "Online service request (no Stripe)",
    });
    return Response.json({ url: `${origin}/signup/success` });
  }

  const stripe = getStripe();
  const priceId = await priceFor(stripe, propertyType, band);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    automatic_tax: { enabled: true },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/signup/success`,
    cancel_url: `${origin}/signup`,
    metadata: {
      customerId,
      propertyId: property[0].id,
    },
  });

  return Response.json({ url: session.url });
}
