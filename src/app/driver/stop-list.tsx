"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatChicago } from "@/lib/chicago";

export function StopList({
  stops,
}: {
  stops: {
    id: string;
    starts_at: string | null;
    kind: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    address_line: string;
    zip: string;
  }[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function complete(jobId: string) {
    setBusyId(jobId);
    setError(null);
    const res = await fetch("/api/driver/jobs/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, notes: notes[jobId] ?? "" }),
    });
    const data = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Could not complete");
      return;
    }
    router.refresh();
  }

  async function logout() {
    await fetch("/api/driver/logout", { method: "POST" });
    router.push("/driver");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="w-fit text-sm underline" onClick={logout}>
        Log out
      </button>
      {error ? <p className="text-amber-200">{error}</p> : null}
      {stops.length === 0 ? (
        <p className="text-zinc-400">No open stops for today.</p>
      ) : null}
      <ul className="space-y-4">
        {stops.map((stop) => (
          <li key={stop.id} className="border border-white/15 px-4 py-4">
            <p className="text-lg font-semibold">{stop.customer_name}</p>
            <p>{stop.address_line}</p>
            <p className="text-zinc-400">
              {stop.zip} · {stop.customer_phone}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {stop.starts_at ? formatChicago(stop.starts_at) : "Time TBD"} ·{" "}
              {stop.kind} · {stop.status}
            </p>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              Notes / chemicals (optional)
              <textarea
                value={notes[stop.id] ?? ""}
                onChange={(e) =>
                  setNotes((current) => ({ ...current, [stop.id]: e.target.value }))
                }
                className="min-h-16 border border-white/20 bg-transparent px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={busyId === stop.id}
              onClick={() => complete(stop.id)}
              className="mt-3 w-full bg-[var(--accent)] px-4 py-3 font-semibold disabled:opacity-60"
            >
              Complete stop
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
