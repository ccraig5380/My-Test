import type { Metadata } from "next";
import { business, houstonZips } from "@/lib/business";

export const metadata: Metadata = { title: "Service area" };

export default function ServiceAreaPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Houston service area</h1>
      <p className="max-w-2xl text-zinc-300">
        We currently accept online bookings for these ZIP codes in and around{" "}
        {business.city}. If your ZIP is not listed, request a quote from signup
        and staff will tell you if we can route to you.
      </p>
      <ul className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
        {[...new Set(houstonZips)].sort().map((zip) => (
          <li key={zip} className="font-mono text-zinc-700">
            {zip}
          </li>
        ))}
      </ul>
    </main>
  );
}
