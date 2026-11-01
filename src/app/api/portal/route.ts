import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as { customerId?: string };
  if (!body.customerId) {
    return Response.json({ error: "Missing customer" }, { status: 400 });
  }
  const stripe = getStripe();
  const origin = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: body.customerId,
    return_url: `${origin}/account`,
  });
  return Response.json({ url: session.url });
}
