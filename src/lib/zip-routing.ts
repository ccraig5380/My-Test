import { visitMinutes, type ServicePlanId } from "@/lib/business";
import {
  addDaysYmd,
  chicagoWeekday,
  chicagoYmd,
  fromChicago,
  isSummerYmd,
  nextWeekdayOnOrAfter,
  summerWindowFor,
} from "@/lib/chicago";
import { getSql } from "@/lib/db";
import { autoSuggestDriver, zoneForZip } from "@/lib/dispatch";

const VISIT_MINUTES_DEFAULT = 45;

type Sql = ReturnType<typeof getSql>;

type ZipRoute = {
  zip: string;
  weekday: number;
  interval_days: number;
  seeded_at: string;
};

type DriverRow = {
  id: string;
  name: string;
  zone: string;
  max_jobs_per_day: number;
  jobsToday: number;
};

export async function placeJobsForNewSubscription(input: {
  customerId: string;
  propertyId: string;
  subscriptionId: string;
  zip: string;
  planType: ServicePlanId;
  acreageBand: string;
}) {
  const sql = getSql();
  const today = chicagoYmd();
  const duration = durationFor(input.acreageBand);

  if (input.planType === "summer" && !isSummerYmd(today)) {
    const window = summerWindowFor(today);
    const route = await getOrSeedRoute(sql, input.zip, null);
    const weekday = route?.weekday ?? 2;
    const first = nextWeekdayOnOrAfter(window.start, weekday);
    if (!route) {
      await sql`
        insert into zip_routes (zip, weekday, interval_days)
        values (${input.zip}, ${weekday}, 21)
        on conflict (zip) do nothing
      `;
    }
    const slot = fromChicago(first, 9, 0);
    const driver = await pickDriver(sql, input.zip, first);
    await insertJob(sql, {
      ...input,
      kind: "route",
      start: slot,
      duration,
      driverId: driver?.id ?? null,
      techName: driver?.name ?? null,
    });
    await sql`
      update subscriptions
      set plan_type = ${input.planType},
          starts_on = ${first},
          ends_on = ${window.end}
      where id = ${input.subscriptionId}
    `;
    return;
  }

  const route = await getRoute(sql, input.zip);
  const nextRouteYmd = route ? await nextRouteDay(sql, route) : null;
  const routeWithinTwo =
    nextRouteYmd != null && daysUntil(today, nextRouteYmd) <= 2;

  if (input.planType === "single") {
    const kickoff = await pickKickoff(sql, input.zip, duration, today);
    await insertJob(sql, {
      ...input,
      kind: "kickoff",
      start: kickoff.start,
      duration,
      driverId: kickoff.driverId,
      techName: kickoff.techName,
    });
    await seedZipFromDate(sql, input.zip, kickoff.start);
    const startYmd = chicagoYmd(kickoff.start);
    await sql`
      update subscriptions
      set plan_type = ${input.planType},
          starts_on = ${startYmd},
          ends_on = ${startYmd}
      where id = ${input.subscriptionId}
    `;
    return;
  }

  if (route && routeWithinTwo && nextRouteYmd) {
    const slot = fromChicago(nextRouteYmd, 9, 0);
    const driver = await pickDriver(sql, input.zip, nextRouteYmd);
    await insertJob(sql, {
      ...input,
      kind: "route",
      start: slot,
      duration,
      driverId: driver?.id ?? null,
      techName: driver?.name ?? null,
    });
    const ends = endsOnFor(input.planType, nextRouteYmd);
    await sql`
      update subscriptions
      set plan_type = ${input.planType},
          starts_on = ${nextRouteYmd},
          ends_on = ${ends}
      where id = ${input.subscriptionId}
    `;
    return;
  }

  const kickoff = await pickKickoff(sql, input.zip, duration, today);
  await insertJob(sql, {
    ...input,
    kind: "kickoff",
    start: kickoff.start,
    duration,
    driverId: kickoff.driverId,
    techName: kickoff.techName,
  });
  await seedZipFromDate(sql, input.zip, kickoff.start);
  const startYmd = chicagoYmd(kickoff.start);
  const freshRoute = await getRoute(sql, input.zip);
  if (freshRoute) {
    const cadenceYmd = await nextRouteDay(sql, freshRoute, startYmd);
    if (cadenceYmd && cadenceYmd !== startYmd && daysUntil(startYmd, cadenceYmd) > 2) {
      const driver = await pickDriver(sql, input.zip, cadenceYmd);
      await insertJob(sql, {
        ...input,
        kind: "route",
        start: fromChicago(cadenceYmd, 9, 0),
        duration,
        driverId: driver?.id ?? null,
        techName: driver?.name ?? null,
      });
    }
  }
  const ends = endsOnFor(input.planType, startYmd);
  await sql`
    update subscriptions
    set plan_type = ${input.planType},
        starts_on = ${startYmd},
        ends_on = ${ends}
    where id = ${input.subscriptionId}
  `;
}

export async function ensureNextRouteJobs() {
  const sql = getSql();
  const today = chicagoYmd();
  const subs = (await sql`
    select s.id, s.customer_id, s.property_id, s.plan_type, s.ends_on,
           p.zip, p.acreage_band
    from subscriptions s
    join properties p on p.id = s.property_id
    where s.cancelled_at is null
      and s.status in ('active', 'pending_payment', 'incomplete')
      and s.plan_type in ('recurring', 'three_month', 'summer')
  `) as {
    id: string;
    customer_id: string;
    property_id: string;
    plan_type: ServicePlanId;
    ends_on: string | null;
    zip: string;
    acreage_band: string;
  }[];

  let created = 0;
  for (const sub of subs) {
    if (sub.ends_on && sub.ends_on < today) continue;
    if (sub.plan_type === "summer" && !isSummerYmd(today) && !sub.ends_on) {
      continue;
    }
    const future = (await sql`
      select id from jobs
      where subscription_id = ${sub.id}
        and completed_at is null
        and starts_at is not null
        and starts_at > now()
        and kind = 'route'
      limit 1
    `) as { id: string }[];
    if (future[0]) continue;
    const route = await getRoute(sql, sub.zip);
    if (!route) continue;
    const nextYmd = await nextRouteDay(sql, route);
    if (!nextYmd) continue;
    if (sub.ends_on && nextYmd > sub.ends_on) continue;
    if (sub.plan_type === "summer" && !isSummerYmd(nextYmd)) continue;
    const duration = durationFor(sub.acreage_band);
    const driver = await pickDriver(sql, sub.zip, nextYmd);
    await insertJob(sql, {
      customerId: sub.customer_id,
      propertyId: sub.property_id,
      subscriptionId: sub.id,
      zip: sub.zip,
      planType: sub.plan_type,
      acreageBand: sub.acreage_band,
      kind: "route",
      start: fromChicago(nextYmd, 9, 0),
      duration,
      driverId: driver?.id ?? null,
      techName: driver?.name ?? null,
    });
    created += 1;
  }
  return created;
}

function durationFor(band: string) {
  if (band === "0_0_5" || band === "0_5_1" || band === "1_5") {
    return visitMinutes[band];
  }
  return VISIT_MINUTES_DEFAULT;
}

function endsOnFor(planType: ServicePlanId, startYmd: string) {
  if (planType === "three_month") return addDaysYmd(startYmd, 90);
  if (planType === "summer") return summerWindowFor(startYmd).end;
  return null;
}

function daysUntil(fromYmd: string, toYmd: string) {
  const from = fromChicago(fromYmd, 12, 0).getTime();
  const to = fromChicago(toYmd, 12, 0).getTime();
  return Math.round((to - from) / 86400000);
}

async function getRoute(sql: Sql, zip: string) {
  const rows = (await sql`
    select zip, weekday, interval_days, seeded_at
    from zip_routes where zip = ${zip} limit 1
  `) as ZipRoute[];
  return rows[0] ?? null;
}

async function getOrSeedRoute(sql: Sql, zip: string, weekday: number | null) {
  const existing = await getRoute(sql, zip);
  if (existing) return existing;
  if (weekday == null) return null;
  await sql`
    insert into zip_routes (zip, weekday, interval_days)
    values (${zip}, ${weekday}, 21)
    on conflict (zip) do nothing
  `;
  return getRoute(sql, zip);
}

async function seedZipFromDate(sql: Sql, zip: string, start: Date) {
  const weekday = chicagoWeekday(start);
  await sql`
    insert into zip_routes (zip, weekday, interval_days)
    values (${zip}, ${weekday}, 21)
    on conflict (zip) do nothing
  `;
}

async function nextRouteDay(sql: Sql, route: ZipRoute, afterYmd?: string) {
  const last = (await sql`
    select starts_at from jobs j
    join properties p on p.id = j.property_id
    where p.zip = ${route.zip}
      and j.starts_at is not null
      and j.kind = 'route'
    order by j.starts_at desc
    limit 1
  `) as { starts_at: string }[];
  const baseYmd = last[0]?.starts_at
    ? chicagoYmd(new Date(last[0].starts_at))
    : chicagoYmd(new Date(route.seeded_at));
  const minYmd = afterYmd
    ? addDaysYmd(afterYmd, 1)
    : addDaysYmd(chicagoYmd(), 0);
  let candidate = nextWeekdayOnOrAfter(
    addDaysYmd(baseYmd, route.interval_days),
    route.weekday,
  );
  const today = minYmd;
  while (candidate < today) {
    candidate = addDaysYmd(candidate, 7);
    candidate = nextWeekdayOnOrAfter(candidate, route.weekday);
  }
  return candidate;
}

async function pickKickoff(
  sql: Sql,
  zip: string,
  duration: number,
  today: string,
) {
  const rules = (await sql`
    select weekday, start_minute, end_minute
    from availability_rules where zone = 'houston'
  `) as { weekday: number; start_minute: number; end_minute: number }[];
  for (let offset = 0; offset <= 2; offset += 1) {
    const ymd = addDaysYmd(today, offset);
    const weekday = fromChicago(ymd, 12, 0);
    const dow = chicagoWeekday(weekday);
    if (dow === 0) continue;
    const rule = rules.find((item) => item.weekday === dow);
    if (!rule) continue;
    const hour = Math.floor(rule.start_minute / 60);
    const minute = rule.start_minute % 60;
    const start = fromChicago(ymd, hour, minute);
    if (start.getTime() < Date.now() && offset === 0) {
      const later = fromChicago(ymd, Math.min(hour + 2, 16), minute);
      if (later.getTime() > Date.now()) {
        const driver = await pickDriver(sql, zip, ymd);
        return {
          start: later,
          driverId: driver?.id ?? null,
          techName: driver?.name ?? null,
        };
      }
      continue;
    }
    const driver = await pickDriver(sql, zip, ymd);
    return {
      start,
      driverId: driver?.id ?? null,
      techName: driver?.name ?? null,
    };
  }
  const fallbackYmd = addDaysYmd(today, 1);
  const driver = await pickDriver(sql, zip, fallbackYmd);
  return {
    start: fromChicago(fallbackYmd, 9, 0),
    driverId: driver?.id ?? null,
    techName: driver?.name ?? null,
  };
}

async function pickDriver(sql: Sql, zip: string, ymd: string) {
  const drivers = (await sql`
    select d.id, d.name, d.zone, d.max_jobs_per_day,
      (
        select count(*)::int from jobs j
        where j.driver_id = d.id
          and j.completed_at is null
          and j.starts_at is not null
          and timezone('America/Chicago', j.starts_at)::date = ${ymd}::date
      ) as jobs_today
    from drivers d
    where d.active = true
  `) as {
    id: string;
    name: string;
    zone: string;
    max_jobs_per_day: number;
    jobs_today: number;
  }[];
  const load: DriverRow[] = drivers.map((driver) => ({
    ...driver,
    jobsToday: driver.jobs_today,
  }));
  const sameZip = (await sql`
    select driver_id from jobs j
    join properties p on p.id = j.property_id
    where p.zip = ${zip}
      and j.driver_id is not null
      and j.starts_at is not null
      and timezone('America/Chicago', j.starts_at)::date = ${ymd}::date
    limit 1
  `) as { driver_id: string }[];
  if (sameZip[0]) {
    const match = load.find(
      (driver) =>
        driver.id === sameZip[0].driver_id &&
        driver.jobsToday < driver.max_jobs_per_day,
    );
    if (match) return match;
  }
  return autoSuggestDriver(zoneForZip(zip), load);
}

async function insertJob(
  sql: Sql,
  input: {
    customerId: string;
    propertyId: string;
    subscriptionId: string;
    zip: string;
    planType: ServicePlanId;
    acreageBand: string;
    kind: "kickoff" | "route";
    start: Date;
    duration: number;
    driverId: string | null;
    techName: string | null;
  },
) {
  const end = new Date(input.start.getTime() + input.duration * 60000);
  await sql`
    insert into jobs (
      customer_id, property_id, subscription_id, driver_id, tech_name,
      starts_at, ends_at, status, kind
    ) values (
      ${input.customerId},
      ${input.propertyId},
      ${input.subscriptionId},
      ${input.driverId},
      ${input.techName},
      ${input.start.toISOString()},
      ${end.toISOString()},
      'scheduled',
      ${input.kind}
    )
  `;
}
