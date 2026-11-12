import { connection } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSql } from "@/lib/db";
import { DriverForm } from "./driver-form";
import { AdminLoginForm } from "./login-form";
import { LogoutButton } from "./logout-button";
import { OpsTable, type OpsRow } from "./ops-table";
import { PromoForm, PromoRowActions } from "./promo-form";
import { ReviewForm, ReviewRowActions } from "./review-form";
import { WeekCalendar, type CalendarJob } from "./week-calendar";

export const instant = false;

export default async function AdminPage() {
  await connection();
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-3 text-3xl font-semibold">Staff back office</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in to manage quotes, customers, promo codes, and the spray calendar.
        </p>
        <AdminLoginForm />
      </main>
    );
  }

  const sql = getSql();
  const drivers = (await sql`
    select id, name, zone, max_jobs_per_day, active
    from drivers
    where active = true
    order by name
  `) as { id: string; name: string; zone: string; max_jobs_per_day: number }[];
  const household = (await sql`
    select
      c.id as customer_id,
      c.name,
      c.email,
      c.phone,
      p.address_line,
      p.zip,
      p.property_type,
      p.acreage_band,
      p.preferred_days,
      s.id as subscription_id,
      s.plan_type,
      s.status as sub_status,
      s.ends_on,
      s.cancelled_at,
      open_job.id as open_job_id,
      open_job.status as job_status,
      open_job.kind as job_kind,
      open_job.starts_at as job_starts_at,
      d.name as driver_name,
      done.last_completed_at,
      zr.weekday as zip_weekday
    from customers c
    left join properties p on p.customer_id = c.id
    left join subscriptions s on s.customer_id = c.id and s.property_id = p.id
    left join lateral (
      select j.id, j.status, j.driver_id, j.kind, j.starts_at
      from jobs j
      where j.customer_id = c.id
        and (p.id is null or j.property_id = p.id)
        and j.completed_at is null
      order by coalesce(j.starts_at, j.created_at) desc
      limit 1
    ) open_job on true
    left join drivers d on d.id = open_job.driver_id
    left join lateral (
      select max(j.completed_at) as last_completed_at
      from jobs j
      where j.customer_id = c.id
    ) done on true
    left join zip_routes zr on zr.zip = p.zip
    order by c.created_at desc
    limit 200
  `) as Record<string, string | number | boolean | null>[];
  const quotes = (await sql`
    select id, name, email, phone, address_line, zip, property_type,
           acreage_exact, notes, status, created_at
    from quote_requests
    order by created_at desc
    limit 80
  `) as Record<string, string>[];
  const jobs = (await sql`
    select j.id, j.starts_at, j.status, j.kind, j.tech_name,
           c.name as customer_name, c.phone as customer_phone,
           p.address_line, p.zip, d.name as driver_name
    from jobs j
    join customers c on c.id = j.customer_id
    join properties p on p.id = j.property_id
    left join drivers d on d.id = j.driver_id
    where j.starts_at is not null
      and j.starts_at > now() - interval '7 days'
      and j.starts_at < now() + interval '14 days'
    order by j.starts_at asc
    limit 200
  `) as CalendarJob[];
  const reviews = (await sql`
    select id, author_name, location, body, rating, published, created_at
    from reviews
    order by created_at desc
    limit 50
  `) as Record<string, string | boolean | number>[];
  const promos = (await sql`
    select id, code, discount_kind, discount_value, max_redemptions,
           times_redeemed, expires_at, duration_visits, season, active
    from promo_codes
    order by created_at desc
    limit 80
  `) as Record<string, string | boolean | number | null>[];

  const opsRows: OpsRow[] = [
    ...household.map((row) => ({
      key: `c-${row.customer_id}-${row.subscription_id ?? "none"}`,
      kind: "customer",
      customerId: String(row.customer_id ?? ""),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      phone: String(row.phone ?? ""),
      address: String(row.address_line ?? ""),
      zip: String(row.zip ?? ""),
      propertyType: String(row.property_type ?? ""),
      acres: String(row.acreage_band ?? ""),
      planType: String(row.plan_type ?? ""),
      subStatus: String(row.sub_status ?? ""),
      endsOn: row.ends_on ? String(row.ends_on).slice(0, 10) : "",
      cancelled: Boolean(row.cancelled_at),
      driverName: String(row.driver_name ?? ""),
      jobStatus: String(row.job_status ?? ""),
      jobKind: String(row.job_kind ?? ""),
      jobStartsAt: String(row.job_starts_at ?? ""),
      openJobId: String(row.open_job_id ?? ""),
      preferredDays: String(row.preferred_days ?? ""),
      lastCompletedAt: row.last_completed_at
        ? String(row.last_completed_at)
        : "",
      subscriptionId: String(row.subscription_id ?? ""),
      quoteId: "",
      zipWeekday:
        row.zip_weekday == null ? null : Number(row.zip_weekday),
    })),
    ...quotes.map((quote) => ({
      key: `q-${quote.id}`,
      kind: "quote",
      customerId: "",
      name: quote.name,
      email: quote.email,
      phone: quote.phone,
      address: quote.address_line,
      zip: quote.zip,
      propertyType: quote.property_type,
      acres: String(quote.acreage_exact ?? ""),
      planType: "",
      subStatus: quote.status,
      endsOn: "",
      cancelled: false,
      driverName: "",
      jobStatus: quote.status,
      jobKind: "",
      jobStartsAt: "",
      openJobId: "",
      preferredDays: quote.notes ?? "",
      lastCompletedAt: "",
      subscriptionId: "",
      quoteId: quote.id,
      zipWeekday: null,
    })),
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-14 px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Staff back office</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Ops table, ZIP calendar, promo codes, and reviews.
          </p>
        </div>
        <LogoutButton />
      </div>

      <OpsTable rows={opsRows} drivers={drivers} />

      <WeekCalendar jobs={jobs} />

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Drivers</h2>
        <ul className="mb-4 text-sm text-zinc-300">
          {drivers.map((driver) => (
            <li key={driver.id}>
              {driver.name} · {driver.zone} · cap {driver.max_jobs_per_day}/day
            </li>
          ))}
        </ul>
        <DriverForm />
        <p className="mt-3 text-sm text-zinc-400">
          Crew phone site: /driver (PIN you set here).
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Homepage reviews</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Type reviews here. Published ones scroll on the home page. They live
          in the Neon <code>reviews</code> table.
        </p>
        <ReviewForm />
        <ul className="mt-6 space-y-3 text-sm">
          {reviews.map((review) => (
            <li
              key={String(review.id)}
              className="border border-white/10 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {String(review.author_name)}
                    {review.location ? (
                      <span className="font-normal text-zinc-400">
                        {" "}
                        · {String(review.location)}
                      </span>
                    ) : null}
                    <span className="ml-2 text-sky-300">
                      {String(review.rating)}/5
                    </span>
                    {!review.published ? (
                      <span className="ml-2 text-zinc-500">hidden</span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-zinc-200">{String(review.body)}</p>
                </div>
                <ReviewRowActions
                  id={String(review.id)}
                  published={Boolean(review.published)}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Promo codes</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Staff-only. Codes apply later at credit-card checkout, not on the
          homepage or Book Service form.
        </p>
        <PromoForm />
        <ul className="mt-6 space-y-3 text-sm">
          {promos.map((promo) => (
            <li
              key={String(promo.id)}
              className="flex flex-wrap items-start justify-between gap-3 border border-white/10 px-4 py-3"
            >
              <div>
                <p className="font-semibold">
                  {String(promo.code)}
                  {!promo.active ? (
                    <span className="ml-2 font-normal text-zinc-500">
                      inactive
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-zinc-300">
                  {formatDiscount(promo.discount_kind, promo.discount_value)}
                  {" · "}
                  {formatUses(promo.max_redemptions, promo.times_redeemed)}
                  {" · expires "}
                  {formatDate(promo.expires_at)}
                </p>
                <p className="mt-1 text-zinc-400">
                  {formatDuration(promo.duration_visits)}
                  {" · "}
                  {formatSeason(promo.season)}
                </p>
              </div>
              <PromoRowActions
                id={String(promo.id)}
                active={Boolean(promo.active)}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function formatDiscount(kind: unknown, value: unknown) {
  const amount = Number(value);
  if (kind === "percent") {
    return `${amount}% off`;
  }
  return `$${amount.toFixed(2)} off`;
}

function formatUses(max: unknown, used: unknown) {
  const redeemed = Number(used ?? 0);
  if (max == null || max === "") {
    return `${redeemed} used · unlimited until expiration`;
  }
  return `${redeemed} / ${Number(max)} uses`;
}

function formatDate(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) {
    return "—";
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }
  return date.toLocaleDateString("en-US", { timeZone: "UTC" });
}

function formatDuration(visits: unknown) {
  if (visits == null || visits === "") {
    return "Unlimited visits";
  }
  const count = Number(visits);
  return `First ${count} visit${count === 1 ? "" : "s"}`;
}

function formatSeason(season: unknown) {
  if (season === "winter") {
    return "Winter (Nov–Feb)";
  }
  if (season === "summer") {
    return "Summer (May–Sep)";
  }
  return "Year-round";
}
