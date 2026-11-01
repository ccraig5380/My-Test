"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JobActions({
  id,
  status,
  tech,
}: {
  id: string;
  status: string;
  tech: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(tech ?? "");

  async function save(nextStatus: string) {
    await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus, techName: name }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tech"
        className="w-28 border border-white/20 bg-transparent px-2 py-1"
      />
      <button type="button" className="underline" onClick={() => save(status)}>
        Assign
      </button>
      <button type="button" className="underline" onClick={() => save("complete")}>
        Done
      </button>
      <button type="button" className="underline" onClick={() => save("rescheduled")}>
        Weather
      </button>
    </div>
  );
}
