import { getSql, logInteraction } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook secret missing" }, { status: 503 });
  }

  const stripe = getStripe();
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sql = getSql();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId = session.metadata?.customerId;
    const propertyId = session.metadata?.propertyId;
    const stripeCustomer =
      typeof session.customer === "string" ? session.customer : null;
    const stripeSub =
      typeof session.subscription === "string" ? session.subscription : null;
    if (customerId && stripeCustomer) {
      await sql`
        update customers
        set stripe_customer_id = ${stripeCustomer}
        where id = ${customerId}
      `;
    }
    if (customerId && propertyId && stripeSub) {
      const sub = (await sql`
        insert into subscriptions (
          customer_id, property_id, stripe_subscription_id, status
        ) values (
          ${customerId}, ${propertyId}, ${stripeSub}, 'active'
        )
        returning id
      `) as { id: string }[];
      await sql`
        insert into jobs (
          customer_id, property_id, subscription_id, status
        ) values (
          ${customerId}, ${propertyId}, ${sub[0].id}, 'needs_schedule'
        )
      `;
      await logInteraction({
        actor: "stripe",
        action: "checkout_completed",
        entityType: "customer",
        entityId: customerId,
        summary: "Stripe checkout completed",
      });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const parent = event.data.object.parent;
    const subRef =
      parent && parent.type === "subscription_details"
        ? parent.subscription_details?.subscription
        : null;
    const subId = typeof subRef === "string" ? subRef : subRef?.id;
    if (subId) {
      await sql`
        update subscriptions set status = 'past_due'
        where stripe_subscription_id = ${subId}
      `;
    }
  }

  return Response.json({ received: true });
}
