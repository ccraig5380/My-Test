"use client";

import { useMemo, useState } from "react";
import { addDaysYmd, chicagoYmd, nextWeekdayOnOrAfter } from "@/lib/chicago";
import { OpsRowActions } from "./ops-row-actions";

export type OpsRow = {
  key: string;
  kind: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  propertyType: string;
  acres: string;
  planType: string;
  subStatus: string;
  endsOn: string;
  cancelled: boolean;
  driverName: string;
  jobStatus: string;
  jobKind: string;
  jobStartsAt: string;
  openJobId: string;
  preferredDays: string;
  lastCompletedAt: string;
  subscriptionId: string;
  quoteId: string;
  zipWeekday: number | null;
};

const presets = [
  { id: "schedule", label: "To Schedule" },
  { id: "interaction", label: "Needs interaction" },
  { id: "expiring", label: "Contract Expiring" },
  { id: "cancelled", label: "Cancelled Customers" },
] as const;

type PresetId = (typeof presets)[number]["id"] | null;

const planLabels: Record<string, string> = {
  recurring: "Recurring",
  three_month: "3 month",
  summer: "Summer",
  single: "Single",
};

function kindLabel(kind: string) {
  return kind === "quote" ? "5+ acre quote" : "Customer";
}

function planLabel(plan: string) {
  if (!plan) return "none";
  return planLabels[plan] ?? plan;
}

function jobLabel(row: OpsRow) {
  if (row.kind === "quote") return row.jobStatus || "none";
  if (!row.jobStatus) return "none";
  if (row.jobStatus === "needs_schedule") return "Needs schedule";
  if (row.jobKind === "kickoff" && !row.jobStartsAt) return "Kickoff due";
  if (row.jobKind === "kickoff") return "Kickoff due";
  if (row.jobStatus === "scheduled" || row.jobKind === "route") return "On route";
  return row.jobStatus;
}

function daysSinceCompleted(iso: string) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function daysSinceLabel(iso: string) {
  const days = daysSinceCompleted(iso);
  if (days == null) return "—";
  return String(days);
}

function remainingRouteDays(row: OpsRow) {
  if (!row.endsOn || row.planType === "recurring" || row.planType === "single") {
    return null;
  }
  const today = chicagoYmd();
  if (row.endsOn < today) return 0;
  const weekday = row.zipWeekday ?? 2;
  let cursor = nextWeekdayOnOrAfter(today, weekday);
  let count = 0;
  while (cursor <= row.endsOn && count < 40) {
    count += 1;
    cursor = addDaysYmd(cursor, 21);
  }
  return count;
}

function uniqueValues(rows: OpsRow[], valueOf: (row: OpsRow) => string) {
  return [...new Set(rows.map((row) => valueOf(row) || "—"))].sort();
}

function ColumnFilter({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  }

  return (
    <th className="min-w-36 py-2 pr-3 align-top">
      <details>
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide">
          {label}
          {selected.length ? ` (${selected.length})` : ""}
        </summary>
        <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-auto text-xs font-normal normal-case">
          {values.map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => toggle(value)}
              />
              {value}
            </label>
          ))}
        </div>
      </details>
    </th>
  );
}

export function OpsTable({
  rows,
  drivers,
}: {
  rows: OpsRow[];
  drivers: { id: string; name: string }[];
}) {
  const [preset, setPreset] = useState<PresetId>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  function setFilter(column: string, values: string[]) {
    setFilters((current) => ({ ...current, [column]: values }));
  }

  function display(row: OpsRow) {
    return {
      kind: kindLabel(row.kind),
      name: row.name || "—",
      phone: row.phone || "—",
      email: row.email || "—",
      address: row.address || "—",
      zip: row.zip || "—",
      acres: row.acres || "—",
      propertyType: row.propertyType || "—",
      planType: planLabel(row.planType),
      subStatus: row.cancelled ? "cancelled" : row.subStatus || "none",
      driverName: row.driverName || "—",
      jobStatus: jobLabel(row),
      daysSince: daysSinceLabel(row.lastCompletedAt),
      lastCompleted: row.lastCompletedAt
        ? new Date(row.lastCompletedAt).toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })
        : "—",
      endsOn: row.endsOn || "—",
    };
  }

  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (preset === "cancelled") {
        if (!row.cancelled) return false;
      } else if (row.cancelled) {
        return false;
      }
      if (preset === "schedule") {
        const waiting =
          row.jobStatus === "needs_schedule" ||
          (row.jobKind === "kickoff" && !row.jobStartsAt);
        if (!waiting) return false;
      }
      if (preset === "interaction") {
        if (row.kind !== "customer" || row.cancelled) return false;
        const days = daysSinceCompleted(row.lastCompletedAt);
        if (days != null && days < 20) return false;
      }
      if (preset === "expiring") {
        if (row.cancelled) return false;
        if (row.planType !== "three_month" && row.planType !== "summer") {
          return false;
        }
        const left = remainingRouteDays(row);
        if (left == null || left > 2) return false;
      }
      const shown = display(row);
      return Object.entries(filters).every(([column, selected]) => {
        if (!selected?.length) return true;
        const value = String(shown[column as keyof typeof shown] ?? "—");
        return selected.includes(value);
      });
    });
  }, [filters, preset, rows]);

  const columns: {
    id: keyof ReturnType<typeof display>;
    label: string;
  }[] = [
    { id: "kind", label: "Kind" },
    { id: "name", label: "Name" },
    { id: "phone", label: "Phone" },
    { id: "email", label: "Email" },
    { id: "address", label: "Address" },
    { id: "zip", label: "ZIP" },
    { id: "acres", label: "Acres" },
    { id: "propertyType", label: "Property" },
    { id: "planType", label: "Plan" },
    { id: "subStatus", label: "Subscription" },
    { id: "driverName", label: "Driver" },
    { id: "jobStatus", label: "Job status" },
    { id: "daysSince", label: "Days since last completed" },
    { id: "lastCompleted", label: "Last completed service" },
    { id: "endsOn", label: "End date" },
  ];

  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Operations</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              setPreset((current) => (current === item.id ? null : item.id))
            }
            className={`px-3 py-2 text-sm font-semibold ${
              preset === item.id
                ? "bg-[var(--accent)] text-white"
                : "border border-white/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        Open a column heading and check one or more values. Last completed
        service changes only when a driver taps Complete on /driver.
      </p>
      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15">
              {columns.map((column) => (
                <ColumnFilter
                  key={column.id}
                  label={column.label}
                  values={uniqueValues(rows, (row) => display(row)[column.id])}
                  selected={filters[column.id] ?? []}
                  onChange={(values) => setFilter(column.id, values)}
                />
              ))}
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="py-6 text-zinc-400" colSpan={columns.length + 1}>
                  No rows for this filter.
                </td>
              </tr>
            ) : null}
            {visible.map((row) => {
              const shown = display(row);
              return (
                <tr key={row.key} className="border-b border-white/10 align-top">
                  {columns.map((column) => (
                    <td key={column.id} className="py-3 pr-3">
                      {shown[column.id]}
                    </td>
                  ))}
                  <td className="py-3 pr-3">
                    <OpsRowActions
                      customerId={row.customerId || null}
                      name={row.name}
                      email={row.email}
                      phone={row.phone}
                      quoteId={row.quoteId || null}
                      subscriptionId={row.subscriptionId || null}
                      planType={row.planType}
                      cancelled={row.cancelled}
                      openJobId={
                        row.jobStatus === "needs_schedule" ||
                        (row.jobKind === "kickoff" && !row.jobStartsAt)
                          ? row.openJobId
                          : null
                      }
                      preferredDays={row.preferredDays}
                      drivers={drivers}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
