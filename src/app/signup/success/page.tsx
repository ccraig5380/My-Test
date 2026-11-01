import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Request received" };

export default function SuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-4xl font-semibold">We have your request.</h1>
      <p className="mt-4 text-zinc-300">
        Online card billing is not live yet. The office will schedule the visit
        and collect payment until Stripe is connected.
      </p>
      <Link href="/" className="mt-8 inline-block font-semibold text-green-400">
        Back to home
      </Link>
    </main>
  );
}
