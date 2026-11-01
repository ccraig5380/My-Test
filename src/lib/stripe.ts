import Stripe from "stripe";
import {
  type AcreageBandId,
  monthlyPricesCents,
  planName,
  type PropertyTypeId,
} from "@/lib/business";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export async function priceFor(
  stripe: Stripe,
  type: PropertyTypeId,
  band: Exclude<AcreageBandId, "5_plus">,
) {
  const cents = monthlyPricesCents[band][type];
  const nickname = planName(type, band);
  const product = await stripe.products.create({
    name: nickname,
    metadata: { type, band },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: cents,
    recurring: { interval: "month" },
    tax_behavior: "exclusive",
    nickname,
  });
  return price.id;
}
