export const CHICAGO_TZ = "America/Chicago";

export function chicagoYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function chicagoWeekday(date = new Date()) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

function chicagoHourMinute(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  return { hour, minute };
}

export function fromChicago(ymd: string, hour: number, minute: number) {
  for (const offset of ["-05:00", "-06:00"] as const) {
    const stamp = `${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset}`;
    const date = new Date(stamp);
    if (chicagoYmd(date) !== ymd) continue;
    const hm = chicagoHourMinute(date);
    if (hm.hour === hour && hm.minute === minute) return date;
  }
  return new Date(
    `${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-06:00`,
  );
}

export function addDaysYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function weekdayOnYmd(ymd: string) {
  return chicagoWeekday(fromChicago(ymd, 12, 0));
}

export function nextWeekdayOnOrAfter(ymd: string, weekday: number) {
  let cursor = ymd;
  for (let i = 0; i < 8; i += 1) {
    if (weekdayOnYmd(cursor) === weekday) return cursor;
    cursor = addDaysYmd(cursor, 1);
  }
  return ymd;
}

export function formatChicago(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString("en-US", { timeZone: CHICAGO_TZ });
}

export function formatChicagoDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    return String(date).slice(0, 10);
  }
  return value.toLocaleDateString("en-US", { timeZone: CHICAGO_TZ });
}

export function startOfChicagoWeek(date = new Date()) {
  const ymd = chicagoYmd(date);
  const weekday = weekdayOnYmd(ymd);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysYmd(ymd, mondayOffset);
}

export function isSummerYmd(ymd: string) {
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  if (month > 4 && month < 10) return true;
  if (month === 4 && day >= 1) return true;
  if (month === 10 && day <= 31) return true;
  return false;
}

export function summerWindowFor(ymd: string) {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  if (month >= 11) {
    return { start: `${year + 1}-04-01`, end: `${year + 1}-10-31` };
  }
  if (month < 4) {
    return { start: `${year}-04-01`, end: `${year}-10-31` };
  }
  return { start: `${year}-04-01`, end: `${year}-10-31` };
}
