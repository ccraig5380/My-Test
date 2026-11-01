import type { Metadata } from "next";
import Link from "next/link";
import { acreageBands, formatUsd, monthlyPricesCents, propertyTypes } from "@/lib/business";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  const bookable = acreageBands.filter((band) => !band.quoteOnly);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Services and pricing</h1>
      <p className="max-w-2xl text-zinc-300">
        Choose a property type and acreage. Monthly prices below are starting
        rates for Houston and can be changed before launch. Properties over 5
        acres are quoted by an administrator.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="py-3 pr-4">Property</th>
              {bookable.map((band) => (
                <th key={band.id} className="py-3 pr-4">
                  {band.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {propertyTypes.map((type) => (
              <tr key={type.id} className="border-b border-zinc-100">
                <td className="py-3 pr-4 font-medium">{type.label}</td>
                {bookable.map((band) => (
                  <td key={band.id} className="py-3 pr-4">
                    {formatUsd(
                      monthlyPricesCents[band.id][type.id],
                    )}
                    /mo
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-zinc-300">
        5+ acres: tell us the exact acreage. We email a quote. No online checkout
        for that band.
      </p>
      <Link href="/signup" className="w-fit font-medium underline">
        Start signup
      </Link>
    </main>
  );
}
