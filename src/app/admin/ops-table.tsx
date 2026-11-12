"use client";

import { useMemo, useState } from "react";
import { addDaysYmd, chicagoYmd, nextWeekdayOnOrAfter } from "@/lib/chicago";
import { OpsRowActions } from "./ops-row-actions";

export type OpsRow = {
  key: string;
  kind: string;
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

function uniqueValues(rows: OpsRow[], key: keyof OpsRow) {
  return [...new Set(rows.map((row) => String(row[key] || "—")))].sort();
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
  return (
    <th className="py-2 pr-3 align-top">
      <div className="mb-1">{label}</div>
      <select
        multiple
        value={selected}
        onChange={(event) =>
          onChange([...event.target.selectedOptions].map((option) => option.value))
        }
        className="max-h-20 min-w-24 border border-white/20 bg-[#0b1220] px-1 py-1 text-xs"
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </th>
  );
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

function daysSinceCompleted(iso: string) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
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

  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (preset === "cancelled") {
        if (!row.cancelled) return false;
      } else if (row.cancelled) {
        return false;
      }
      if (preset === "schedule" && row.jobStatus !== "needs_schedule") {
        return false;
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
      const checks: [string, string][] = [
        ["kind", row.kind],
        ["name", row.name],
        ["zip", row.zip],
        ["planType", row.planType || "none"],
        ["driverName", row.driverName || "—"],
        ["jobStatus", row.jobStatus || "none"],
        ["subStatus", row.subStatus || "none"],
      ];
      return checks.every(([column, value]) => {
        const selected = filters[column];
        if (!selected?.length) return true;
        return selected.includes(value || "—");
      });
    });
  }, [filters, preset, rows]);

  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Operations</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset((current) => (current === item.id ? null : item.id))}
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
        Hold Ctrl (or Cmd) to choose multiple filter values in a column. Last
        completed service changes only when a driver taps Complete on /driver.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <ColumnFilter
                label="Kind"
                values={uniqueValues(rows, "kind")}
                selected={filters.kind ?? []}
                onChange={(values) => setFilter("kind", values)}
              />
              <ColumnFilter
                label="Name"
                values={uniqueValues(rows, "name")}
                selected={filters.name ?? []}
                onChange={(values) => setFilter("name", values)}
              />
              <ColumnFilter
                label="ZIP"
                values={uniqueValues(rows, "zip")}
                selected={filters.zip ?? []}
                onChange={(values) => setFilter("zip", values)}
              />
              <ColumnFilter
                label="Plan"
                values={uniqueValues(rows, "planType")}
                selected={filters.planType ?? []}
                onChange={(values) => setFilter("planType", values)}
              />
              <ColumnFilter
                label="Driver"
                values={uniqueValues(rows, "driverName")}
                selected={filters.driverName ?? []}
                onChange={(values) => setFilter("driverName", values)}
              />
              <ColumnFilter
                label="Job"
                values={uniqueValues(rows, "jobStatus")}
                selected={filters.jobStatus ?? []}
                onChange={(values) => setFilter("jobStatus", values)}
              />
              <th className="py-2 pr-3">Last completed service</th>
              <th className="py-2 pr-3">End</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const days = daysSinceCompleted(row.lastCompletedAt);
              return (
                <tr key={row.key} className="border-b border-white/10 align-top">
                  <td className="py-3 pr-3">{row.kind}</td>
                  <td className="py-3 pr-3">
                    <div>{row.name}</div>
                    <div className="text-zinc-400">{row.phone}</div>
                    <div className="text-zinc-400">{row.email}</div>
                    <div className="text-zinc-400">
                      {row.address} {row.zip}
                    </div>
                  </td>
                  <td className="py-3 pr-3">{row.zip}</td>
                  <td className="py-3 pr-3">
                    {row.planType || "none"}
                    <div className="text-zinc-400">
                      {row.acres} {row.propertyType}
                    </div>
                    <div className="text-zinc-400">{row.subStatus || "none"}</div>
                  </td>
                  <td className="py-3 pr-3">{row.driverName || "—"}</td>
                  <td className="py-3 pr-3">{row.jobStatus || "none"}</td>
                  <td className="py-3 pr-3">
                    {row.lastCompletedAt
                      ? new Date(row.lastCompletedAt).toLocaleString("en-US", {
                          timeZone: "America/Chicago",
                        })
                      : "—"}
                    {days != null ? (
                      <div className="text-zinc-400">{days} days ago</div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">{row.endsOn || "—"}</td>
                  <td className="py-3 pr-3">
                    <OpsRowActions
                      quoteId={row.quoteId || null}
                      subscriptionId={row.subscriptionId || null}
                      planType={row.planType}
                      cancelled={row.cancelled}
                      openJobId={
                        row.jobStatus === "needs_schedule" ? row.openJobId : null
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
