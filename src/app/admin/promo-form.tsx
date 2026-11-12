"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromoForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountKind, setDiscountKind] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [useLimitKind, setUseLimitKind] = useState("integer");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [durationVisits, setDurationVisits] = useState("");
  const [season, setSeason] = useState("year_round");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountKind,
        discountValue: Number(discountValue),
        useLimitKind,
        maxRedemptions:
          useLimitKind === "integer" ? Number(maxRedemptions) : null,
        expiresAt,
        durationVisits,
        season,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save promo");
      return;
    }
    setCode("");
    setDiscountValue("");
    setMaxRedemptions("");
    setExpiresAt("");
    setDurationVisits("");
    setSeason("year_round");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        Promo code
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="WINTER10"
          className="border border-white/20 bg-transparent px-3 py-2 uppercase"
        />
      </label>
      <fieldset className="flex flex-wrap items-end gap-4 text-sm">
        <legend className="mb-1 w-full text-sm">Discount</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="discountKind"
            checked={discountKind === "percent"}
            onChange={() => setDiscountKind("percent")}
          />
          Percent off
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="discountKind"
            checked={discountKind === "fixed"}
            onChange={() => setDiscountKind("fixed")}
          />
          Dollars off
        </label>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        {discountKind === "percent" ? "Percent" : "Dollars"}
        <input
          required
          type="number"
          min="0.01"
          step={discountKind === "percent" ? "1" : "0.01"}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          className="border border-white/20 bg-transparent px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          Max uses
          <select
            value={useLimitKind}
            onChange={(e) => setUseLimitKind(e.target.value)}
            className="border border-white/20 bg-[#0b1220] px-3 py-2"
          >
            <option value="integer">Integer</option>
            <option value="unlimited">Unlimited until expiration</option>
          </select>
        </label>
        {useLimitKind === "integer" ? (
          <label className="flex w-32 flex-col gap-1 text-sm">
            Use count
            <input
              required
              type="number"
              min="1"
              step="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              className="border border-white/20 bg-transparent px-3 py-2"
            />
          </label>
        ) : null}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Expiration date
        <input
          required
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="border border-white/20 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Applies for
        <select
          value={durationVisits}
          onChange={(e) => setDurationVisits(e.target.value)}
          className="border border-white/20 bg-[#0b1220] px-3 py-2"
        >
          <option value="">Unlimited visits</option>
          <option value="1">First 1 visit</option>
          <option value="2">First 2 visits</option>
          <option value="3">First 3 visits</option>
          <option value="6">First 6 visits</option>
          <option value="12">First 12 visits</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Season
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="border border-white/20 bg-[#0b1220] px-3 py-2"
        >
          <option value="year_round">Year-round</option>
          <option value="winter">Winter (Nov–Feb)</option>
          <option value="summer">Summer (May–Sep)</option>
        </select>
      </label>
      <button
        disabled={busy}
        className="w-fit bg-[var(--accent)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        Save promo code
      </button>
      {error ? <p className="text-sm text-amber-200 sm:col-span-2">{error}</p> : null}
    </form>
  );
}

export function PromoRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    router.refresh();
  }

  return (
    <button type="button" className="text-sky-300 underline" onClick={toggle}>
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
