import type { Metadata } from "next";
import { business } from "@/lib/business";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-sm leading-7 text-zinc-300">
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        Terms of service
      </h1>
      <p>
        By booking with {business.name} you agree to recurring barrier
        treatments at the address you provide, billed monthly through Stripe
        until you pause or cancel in the customer portal. Weather and access
        issues can move a visit.
      </p>
      <p>
        Properties of 5 acres or more are quoted by staff and are not priced
        online. Have a Texas CPA confirm tax on pest-control services. This
        draft is not legal advice.
      </p>
    </main>
  );
}
