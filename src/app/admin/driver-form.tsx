"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DriverForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [zone, setZone] = useState("houston");
  const [maxJobsPerDay, setMaxJobsPerDay] = useState("8");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        zone,
        maxJobsPerDay: Number(maxJobsPerDay),
      }),
    });
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap gap-2">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Driver name"
        className="border border-white/20 bg-transparent px-2 py-1"
      />
      <input
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        placeholder="Zone"
        className="w-32 border border-white/20 bg-transparent px-2 py-1"
      />
      <input
        type="number"
        min={1}
        value={maxJobsPerDay}
        onChange={(e) => setMaxJobsPerDay(e.target.value)}
        className="w-20 border border-white/20 bg-transparent px-2 py-1"
      />
      <button className="bg-[var(--accent)] px-3 py-1 text-sm font-semibold">
        Add driver
      </button>
    </form>
  );
}
