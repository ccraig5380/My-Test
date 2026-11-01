"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScheduleForm({
  jobId,
  drivers,
  preferredDays,
}: {
  jobId: string;
  preferredDays: string | null;
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [startsAt, setStartsAt] = useState("");
  const [driverId, setDriverId] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, startsAt, driverId }),
    });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      {preferredDays ? (
        <p className="text-xs text-zinc-400">Preferred: {preferredDays}</p>
      ) : null}
      <input
        type="datetime-local"
        required
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        className="border border-white/20 bg-transparent px-2 py-1 text-sm"
      />
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="border border-white/20 bg-[#0b1220] px-2 py-1 text-sm"
      >
        <option value="">Unassigned</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name}
          </option>
        ))}
      </select>
      <button className="w-fit bg-[var(--accent)] px-3 py-1 text-sm font-semibold">
        Schedule
      </button>
    </form>
  );
}
