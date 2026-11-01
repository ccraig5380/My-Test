"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm() {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [location, setLocation] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState("5");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName,
        location,
        quote,
        rating: Number(rating),
        published: true,
      }),
    });
    setAuthorName("");
    setLocation("");
    setQuote("");
    setRating("5");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-2 sm:grid-cols-2">
      <input
        required
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Customer name"
        className="border border-white/20 bg-transparent px-3 py-2"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Neighborhood or city (optional)"
        className="border border-white/20 bg-transparent px-3 py-2"
      />
      <textarea
        required
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Type the review"
        className="min-h-24 border border-white/20 bg-transparent px-3 py-2 sm:col-span-2"
      />
      <label className="flex items-center gap-2 text-sm">
        Stars
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border border-white/20 bg-[#0b1220] px-2 py-1"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={busy}
        className="w-fit justify-self-end bg-[var(--accent)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        Publish review
      </button>
    </form>
  );
}

export function ReviewRowActions({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published: !published }),
    });
    router.refresh();
  }

  async function remove() {
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex gap-3 text-sm">
      <button type="button" className="text-sky-300 underline" onClick={toggle}>
        {published ? "Hide" : "Show"}
      </button>
      <button type="button" className="text-sky-300 underline" onClick={remove}>
        Delete
      </button>
    </div>
  );
}
