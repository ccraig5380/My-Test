"use client";

import { useRouter } from "next/navigation";

export function QuoteActions({ id }: { id: string }) {
  const router = useRouter();
  async function setStatus(status: string) {
    await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      {["quoted", "won", "lost"].map((status) => (
        <button
          key={status}
          type="button"
          className="text-green-400 underline"
          onClick={() => setStatus(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
