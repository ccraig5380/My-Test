import { connection } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSql } from "@/lib/db";
import { CustomerEdit } from "./customer-edit";
import { DriverForm } from "./driver-form";
import { JobActions } from "./job-actions";
import { AdminLoginForm } from "./login-form";
import { LogoutButton } from "./logout-button";
import { QuoteActions } from "./quote-actions";
import { ReviewForm, ReviewRowActions } from "./review-form";
import { ScheduleForm } from "./schedule-form";

export const instant = false;

export default async function AdminPage() {
  await connection();
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-3 text-3xl font-semibold">Staff back office</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in to manage quotes, customers, and the spray calendar.
        </p>
        <AdminLoginForm />
      </main>
    );
  }

  const sql = getSql();
  const quotes = (await sql`
    select id, name, email, phone, address_line, zip, property_type,
           acreage_exact, notes, status, created_at
    from quote_requests
    order by created_at desc
    limit 50
  `) as Record<string, string>[];
  const customers = (await sql`
    select c.id, c.name, c.email, c.phone, c.created_at,
           p.address_line, p.zip, p.property_type, p.acreage_band,
           s.status as subscription_status
    from customers c
    left join properties p on p.customer_id = c.id
    left join subscriptions s on s.customer_id = c.id
    order by c.created_at desc
    limit 80
  `) as Record<string, string>[];
  const drivers = (await sql`
    select id, name, zone, max_jobs_per_day, active
    from drivers
    where active = true
    order by name
  `) as { id: string; name: string; zone: string; max_jobs_per_day: number }[];
  const needsSchedule = (await sql`
    select j.id, c.name, c.phone, p.address_line, p.zip, p.preferred_days
    from jobs j
    join customers c on c.id = j.customer_id
    join properties p on p.id = j.property_id
    where j.status = 'needs_schedule'
    order by j.created_at asc
    limit 50
  `) as Record<string, string>[];
  const jobs = (await sql`
    select j.id, j.starts_at, j.ends_at, j.status, j.tech_name,
           c.name as customer_name, c.phone as customer_phone,
           p.address_line, p.zip
    from jobs j
    join customers c on c.id = j.customer_id
    join properties p on p.id = j.property_id
    where j.starts_at > now() - interval '14 days'
    order by j.starts_at asc
    limit 80
  `) as Record<string, string>[];
  const interactions = (await sql`
    select id, occurred_at, actor, action, entity_type, summary
    from interactions
    order by occurred_at desc
    limit 50
  `) as Record<string, string>[];
  const reviews = (await sql`
    select id, author_name, location, body, rating, published, created_at
    from reviews
    order by created_at desc
    limit 50
  `) as Record<string, string | boolean | number>[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Staff back office</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Quotes, customer records, and the job calendar.
          </p>
        </div>
        <LogoutButton />
      </div>

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
        <h2 className="mb-4 text-2xl font-semibold">Customers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-2 pr-3">Record</th>
                <th className="py-2 pr-3">Property</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((row) => (
                <tr key={row.id} className="border-b border-white/10 align-top">
                  <td className="py-3 pr-3">
                    <div>{row.name}</div>
                    <div className="text-zinc-400">{row.email}</div>
                    <div className="text-zinc-400">{row.phone}</div>
                  </td>
                  <td className="py-3 pr-3">
                    {row.address_line} {row.zip}
                    <div className="text-zinc-400">{row.property_type}</div>
                  </td>
                  <td className="py-3 pr-3">
                    {row.acreage_band}
                    <div className="text-zinc-400">
                      {row.subscription_status ?? "none"}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <CustomerEdit
                      id={row.id}
                      name={row.name}
                      email={row.email}
                      phone={row.phone}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">5+ acre quotes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3">Property</th>
                <th className="py-2 pr-3">Acres</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-white/10 align-top">
                  <td className="py-2 pr-3">
                    {new Date(quote.created_at).toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    {quote.name}
                    <div className="text-zinc-400">{quote.email}</div>
                    <div className="text-zinc-400">{quote.phone}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {quote.address_line} {quote.zip}
                    <div className="text-zinc-400">{quote.notes}</div>
                  </td>
                  <td className="py-2 pr-3">{quote.acreage_exact}</td>
                  <td className="py-2 pr-3">{quote.status}</td>
                  <td className="py-2 pr-3">
                    <QuoteActions id={quote.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Needs scheduling</h2>
        <p className="mb-3 text-sm text-zinc-400">
          Paid stops waiting for you to pick a day and driver. Later, turn on
          AUTO_DISPATCH to auto-fill drivers by zone and daily cap.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Address</th>
                <th className="py-2 pr-3">Put on calendar</th>
              </tr>
            </thead>
            <tbody>
              {needsSchedule.map((row) => (
                <tr key={row.id} className="border-b border-white/10 align-top">
                  <td className="py-2 pr-3">
                    {row.name}
                    <div className="text-zinc-400">{row.phone}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {row.address_line} {row.zip}
                  </td>
                  <td className="py-2 pr-3">
                    <ScheduleForm
                      jobId={row.id}
                      preferredDays={row.preferred_days}
                      drivers={drivers}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Job calendar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Address</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Crew</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-white/10">
                  <td className="py-2 pr-3">
                    {new Date(job.starts_at).toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    {job.customer_name}
                    <div className="text-zinc-400">{job.customer_phone}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {job.address_line} {job.zip}
                  </td>
                  <td className="py-2 pr-3">{job.status}</td>
                  <td className="py-2 pr-3">
                    <JobActions
                      id={job.id}
                      status={job.status}
                      tech={job.tech_name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Interaction log</h2>
        <p className="mb-3 text-sm text-zinc-400">
          Same rows live in Neon table <code>interactions</code>. Open them in
          the Neon console without using this site.
        </p>
        <ul className="space-y-2 text-sm">
          {interactions.map((row) => (
            <li key={row.id} className="border border-white/10 px-3 py-2">
              {new Date(row.occurred_at).toLocaleString("en-US", {
                timeZone: "America/Chicago",
              })}{" "}
              · {row.actor} · {row.action} · {row.entity_type}
              {row.summary ? ` · ${row.summary}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
