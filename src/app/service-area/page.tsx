import type { Metadata } from "next";
import { business, houstonZips } from "@/lib/business";
import { ServiceAreaMap } from "./service-area-map";

export const metadata: Metadata = { title: "Service Area" };

export default function ServiceAreaPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Service Area</h1>
      <p className="max-w-2xl text-zinc-300">
        Greater Houston in an even radius from the city: west through Katy,
        north through Tomball, and south past Rosharon. If your ZIP is not
        listed, request a quote and we will tell you if we can route to you.
      </p>
      <ServiceAreaMap />
      <p className="text-xs text-zinc-500">
        Highlighted coverage is about 34 miles from central Houston.
      </p>
      <h2 className="mt-4 text-lg font-semibold">ZIPs we book online</h2>
      <ul className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
        {[...new Set(houstonZips)].sort().map((zip) => (
          <li key={zip} className="font-mono text-zinc-300">
            {zip}
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-400">
        {business.city} · {business.name}
      </p>
    </main>
  );
}
