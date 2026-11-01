"use client";

import { useState } from "react";
import { ClerkSignIn } from "./clerk-signin";

type Job = {
  id: string;
  starts_at: string;
  status: string;
  stripe_customer_id: string | null;
};

export function AccountClient() {
  const [email, setEmail] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  async function load(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch(`/api/account/jobs?email=${encodeURIComponent(email)}`);
    const data = (await res.json()) as { jobs?: Job[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not load visits");
      return;
    }
    setJobs(data.jobs ?? []);
  }

  async function openPortal(customerId: string) {
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    else setError(data.error ?? "Portal unavailable");
  }

  const stripeId = jobs.find((job) => job.stripe_customer_id)?.stripe_customer_id;

  return (
    <div className="flex flex-col gap-6">
      {clerkEnabled ? <ClerkSignIn /> : null}
      {clerkEnabled ? (
        <p className="text-sm text-zinc-400">
          Sign in with Clerk, then look up the email on the subscription to
          open Stripe billing.
        </p>
      ) : (
        <p className="text-sm text-zinc-400">
          Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY for full
          login. Until then, look up visits by the email used at checkout.
        </p>
      )}
      <form onSubmit={load} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email on the subscription"
          className="border border-white/20 bg-transparent px-3 py-2"
        />
        <button className="w-fit bg-[var(--accent)] px-4 py-2 font-semibold">
          Show visits
        </button>
      </form>
      {error ? <p className="text-amber-200">{error}</p> : null}
      <ul className="flex flex-col gap-2 text-sm">
        {jobs.map((job) => (
          <li key={job.id} className="border border-white/10 px-3 py-2">
            {new Date(job.starts_at).toLocaleString("en-US", {
              timeZone: "America/Chicago",
            })}{" "}
            · {job.status}
          </li>
        ))}
      </ul>
      {stripeId ? (
        <button
          type="button"
          className="w-fit font-semibold text-green-400 underline"
          onClick={() => openPortal(stripeId)}
        >
          Manage card, pause, or cancel
        </button>
      ) : null}
    </div>
  );
}
