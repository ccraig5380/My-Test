"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acreageBands } from "@/lib/business";

export function HomeLeadForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [acreageBand, setAcreageBand] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      acreageBand,
    });
    router.push(`/signup?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full gap-3 rounded-sm border border-white/15 bg-[#1c2840]/80 p-5 backdrop-blur-sm sm:grid-cols-2 lg:p-8"
    >
      <h2 className="sm:col-span-2 mb-1 text-2xl font-semibold tracking-tight text-white">
        Check Your Pricing And Book Service
      </h2>
      <label className="flex flex-col gap-1 text-sm">
        First name
        <input
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          className="border border-white/25 bg-transparent px-3 py-2 text-base text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Last name
        <input
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          className="border border-white/25 bg-transparent px-3 py-2 text-base text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Address
        <input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
          className="border border-white/25 bg-transparent px-3 py-2 text-base text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Lot Size
        <select
          required
          value={acreageBand}
          onChange={(e) => setAcreageBand(e.target.value)}
          className="border border-white/25 bg-[#1c2840] px-3 py-2 text-base text-white"
        >
          <option value="" disabled>
            Select Lot Size
          </option>
          {acreageBands.map((band) => (
            <option key={band.id} value={band.id}>
              {band.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="sm:col-span-2 mt-1 rounded-sm bg-[var(--accent)] px-6 py-3 font-semibold text-white hover:bg-[var(--accent-hover)]"
      >
        Continue
      </button>
    </form>
  );
}
