"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerEdit({
  id,
  name,
  email,
  phone,
}: {
  id: string;
  name: string;
  email: string;
  phone: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name, email, phone });
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-36 border border-white/20 bg-transparent px-2 py-1"
      />
      <input
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-44 border border-white/20 bg-transparent px-2 py-1"
      />
      <input
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-32 border border-white/20 bg-transparent px-2 py-1"
      />
      <button className="bg-[var(--accent)] px-3 py-1 text-sm font-semibold">
        Save
      </button>
      {saved ? <span className="text-xs text-green-400">Saved</span> : null}
    </form>
  );
}
