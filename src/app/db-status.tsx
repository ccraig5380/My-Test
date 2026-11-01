"use client";

import { useEffect, useState } from "react";

type Health = {
  ok: boolean;
  database: "connected" | "not_configured" | "error";
};

export function DbStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/health")
      .then(async (response) => {
        const body = (await response.json()) as Health;
        if (!cancelled) setHealth(body);
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false, database: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return <p className="text-zinc-500">Checking Neon…</p>;
  }

  const label =
    health.database === "connected"
      ? "Neon is connected"
      : health.database === "not_configured"
        ? "Neon is not configured yet (add DATABASE_URL)"
        : "Neon check failed";

  return (
    <p className={health.ok ? "text-emerald-700" : "text-amber-700"}>{label}</p>
  );
}
