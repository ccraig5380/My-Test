"use client";

import { useMemo, useState } from "react";
import {
  acreageBands,
  formatUsd,
  isCoveredZip,
  monthlyPricesCents,
  propertyTypes,
  type AcreageBandId,
  type PropertyTypeId,
} from "@/lib/business";

const empty = {
  propertyType: "" as PropertyTypeId | "",
  acreageBand: "" as AcreageBandId | "",
  acreageExact: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  zip: "",
  notes: "",
  preferredDays: "",
};

export function SignupForm() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const quoteOnly = form.acreageBand === "5_plus";
  const bookable =
    form.acreageBand === "0_0_5" ||
    form.acreageBand === "0_5_1" ||
    form.acreageBand === "1_5";

  const price = useMemo(() => {
    if (
      !form.propertyType ||
      (form.acreageBand !== "0_0_5" &&
        form.acreageBand !== "0_5_1" &&
        form.acreageBand !== "1_5")
    ) {
      return null;
    }
    return monthlyPricesCents[form.acreageBand][form.propertyType];
  }, [form.acreageBand, form.propertyType]);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    if (!form.propertyType || !form.acreageBand) {
      setStatus("Choose a property type and acreage.");
      return;
    }
    setBusy(true);
    try {
      if (quoteOnly) {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) throw new Error(data.error ?? "Quote failed");
        setStatus(data.message ?? "We will contact you with a quote.");
        return;
      }
      if (form.zip && !isCoveredZip(form.zip)) {
        setStatus("That ZIP is outside the published Houston service area.");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-semibold">Property type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {propertyTypes.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer items-center gap-3 border border-white/15 px-4 py-3"
            >
              <input
                type="radio"
                name="propertyType"
                required
                checked={form.propertyType === type.id}
                onChange={() => set("propertyType", type.id)}
              />
              {type.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-semibold">Acreage (required)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {acreageBands.map((band) => (
            <label
              key={band.id}
              className="flex cursor-pointer items-center gap-3 border border-white/15 px-4 py-3"
            >
              <input
                type="radio"
                name="acreageBand"
                required
                checked={form.acreageBand === band.id}
                onChange={() => set("acreageBand", band.id)}
              />
              {band.label}
            </label>
          ))}
        </div>
      </fieldset>

      {quoteOnly ? (
        <label className="flex flex-col gap-2">
          Exact acreage (5 or more)
          <input
            type="number"
            min={5}
            step="0.1"
            required
            value={form.acreageExact}
            onChange={(e) => set("acreageExact", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2">
          Phone
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          Service address
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2">
          ZIP
          <input
            required
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
      </div>

      {bookable ? (
        <label className="flex flex-col gap-2">
          Preferred days or notes for the crew (optional)
          <input
            value={form.preferredDays}
            onChange={(e) => set("preferredDays", e.target.value)}
            placeholder="Tue/Thu mornings, gate code, dogs, etc."
            className="border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-2">
          Notes for the quote
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="min-h-24 border border-white/20 bg-transparent px-3 py-2"
          />
        </label>
      )}

      {bookable && price != null ? (
        <p className="text-xl font-semibold">
          {formatUsd(price)} per month when billing is turned on. For now we
          take the request and staff schedules the visit.
        </p>
      ) : null}

      {status ? <p className="text-amber-200">{status}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-sm bg-[var(--accent)] px-8 py-4 font-semibold text-white disabled:opacity-60"
      >
        {quoteOnly ? "Request quote" : "Submit service request"}
      </button>
    </form>
  );
}
