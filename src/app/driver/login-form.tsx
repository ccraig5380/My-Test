"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DriverLoginForm({
  drivers,
}: {
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/driver/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, pin }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/driver");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Your name
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="border border-white/20 bg-[#0b1220] px-3 py-3 text-base"
        >
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        PIN
        <input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="border border-white/20 bg-transparent px-3 py-3 text-lg"
        />
      </label>
      <button className="w-fit bg-[var(--accent)] px-5 py-3 font-semibold">
        Sign in
      </button>
      {error ? <p className="text-amber-200">{error}</p> : null}
    </form>
  );
}
