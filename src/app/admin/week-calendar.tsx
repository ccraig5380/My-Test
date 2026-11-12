"use client";

import { addDaysYmd, chicagoYmd, formatChicago, startOfChicagoWeek } from "@/lib/chicago";
import { JobActions } from "./job-actions";

export type CalendarJob = {
  id: string;
  starts_at: string;
  status: string;
  kind: string;
  tech_name: string | null;
  customer_name: string;
  customer_phone: string;
  address_line: string;
  zip: string;
  driver_name: string | null;
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekCalendar({ jobs }: { jobs: CalendarJob[] }) {
  const monday = startOfChicagoWeek();
  const days = dayNames.map((label, index) => {
    const ymd = addDaysYmd(monday, index);
    const items = jobs
      .filter((job) => job.starts_at && chicagoYmd(new Date(job.starts_at)) === ymd)
      .sort((a, b) => a.zip.localeCompare(b.zip) || a.starts_at.localeCompare(b.starts_at));
    const byZip = new Map<string, CalendarJob[]>();
    for (const job of items) {
      const list = byZip.get(job.zip) ?? [];
      list.push(job);
      byZip.set(job.zip, list);
    }
    return { label, ymd, byZip };
  });

  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Week calendar</h2>
      <p className="mb-4 text-sm text-zinc-400">
        America/Chicago, grouped by ZIP. Completing a stop happens on /driver,
        not here.
      </p>
      <div className="grid gap-3 lg:grid-cols-6">
        {days.map((day) => (
          <div key={day.ymd} className="border border-white/10 px-3 py-3">
            <p className="mb-2 font-semibold">
              {day.label}
              <span className="ml-2 text-xs font-normal text-zinc-400">
                {day.ymd.slice(5)}
              </span>
            </p>
            {[...day.byZip.entries()].map(([zip, stops]) => (
              <div key={zip} className="mb-3">
                <p className="text-xs uppercase tracking-wide text-sky-300">{zip}</p>
                <ul className="mt-1 space-y-2 text-xs">
                  {stops.map((job) => (
                    <li key={job.id} className="border border-white/10 px-2 py-2">
                      <p className="font-semibold">{job.customer_name}</p>
                      <p className="text-zinc-400">{job.address_line}</p>
                      <p className="text-zinc-400">
                        {formatChicago(job.starts_at)} · {job.kind} · {job.status}
                      </p>
                      <p className="text-zinc-400">
                        {job.driver_name ?? job.tech_name ?? "Unassigned"}
                      </p>
                      <JobActions
                        id={job.id}
                        status={job.status}
                        tech={job.tech_name}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
