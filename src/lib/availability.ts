import {
  type AcreageBandId,
  visitMinutes,
  type PropertyTypeId,
} from "@/lib/business";
import { ensureSchema, getSql } from "@/lib/db";

export type Slot = { start: string; end: string };

function onHoustonDate(base: Date, weekday: number, minute: number) {
  const date = new Date(base);
  const current = date.getUTCDay();
  const delta = (weekday - current + 7) % 7;
  date.setUTCDate(date.getUTCDate() + delta);
  date.setUTCHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return date;
}

export async function listOpenSlots(band: Exclude<AcreageBandId, "5_plus">) {
  await ensureSchema();
  const sql = getSql();
  const duration = visitMinutes[band];
  const rules = (await sql`
    select weekday, start_minute, end_minute
    from availability_rules
    where zone = 'houston'
  `) as { weekday: number; start_minute: number; end_minute: number }[];

  const existing = (await sql`
    select starts_at, ends_at from jobs
    where status in ('scheduled', 'assigned')
      and starts_at > now()
      and starts_at < now() + interval '21 days'
  `) as { starts_at: string; ends_at: string }[];

  const slots: Slot[] = [];
  const today = new Date();

  for (let week = 0; week < 3; week += 1) {
    for (const rule of rules) {
      const windowStart = onHoustonDate(
        new Date(today.getTime() + week * 7 * 86400000),
        rule.weekday,
        rule.start_minute,
      );
      const windowEnd = onHoustonDate(
        new Date(today.getTime() + week * 7 * 86400000),
        rule.weekday,
        rule.end_minute,
      );
      for (
        let cursor = windowStart.getTime();
        cursor + duration * 60000 <= windowEnd.getTime();
        cursor += duration * 60000
      ) {
        const start = new Date(cursor);
        const end = new Date(cursor + duration * 60000);
        if (start.getTime() < Date.now() + 36 * 3600000) continue;
        const busy = existing.some((job) => {
          const jobStart = new Date(job.starts_at).getTime();
          const jobEnd = new Date(job.ends_at).getTime();
          return start.getTime() < jobEnd && end.getTime() > jobStart;
        });
        if (!busy) {
          slots.push({ start: start.toISOString(), end: end.toISOString() });
        }
      }
    }
  }

  return slots.slice(0, 40);
}

export function assertBookable(
  type: string,
  band: string,
): asserts band is Exclude<AcreageBandId, "5_plus"> {
  const types: PropertyTypeId[] = [
    "residential",
    "commercial",
    "golf",
    "hoa",
    "other",
  ];
  if (!types.includes(type as PropertyTypeId)) {
    throw new Error("Invalid property type");
  }
  if (band === "5_plus") {
    throw new Error("5+ acres must be quoted");
  }
  if (band !== "0_0_5" && band !== "0_5_1" && band !== "1_5") {
    throw new Error("Invalid acreage");
  }
}
