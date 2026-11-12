"use client";

import { useRouter } from "next/navigation";
import { QuoteActions } from "./quote-actions";
import { ScheduleForm } from "./schedule-form";

export function OpsRowActions({
  quoteId,
  subscriptionId,
  planType,
  cancelled,
  openJobId,
  preferredDays,
  drivers,
}: {
  quoteId?: string | null;
  subscriptionId?: string | null;
  planType?: string | null;
  cancelled?: boolean;
  openJobId?: string | null;
  preferredDays?: string | null;
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();

  async function patch(action: "cancel" | "recurring") {
    if (!subscriptionId) return;
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subscriptionId, action }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {quoteId ? <QuoteActions id={quoteId} /> : null}
      {openJobId ? (
        <ScheduleForm
          jobId={openJobId}
          preferredDays={preferredDays ?? null}
          drivers={drivers}
        />
      ) : null}
      {subscriptionId && !cancelled ? (
        <button
          type="button"
          className="w-fit text-amber-200 underline"
          onClick={() => patch("cancel")}
        >
          Cancel
        </button>
      ) : null}
      {subscriptionId &&
      (planType === "three_month" || planType === "summer") &&
      !cancelled ? (
        <button
          type="button"
          className="w-fit text-sky-300 underline"
          onClick={() => patch("recurring")}
        >
          Convert to Recurring
        </button>
      ) : null}
    </div>
  );
}
