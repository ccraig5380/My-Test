import { connection } from "next/server";
import { chicagoYmd } from "@/lib/chicago";
import { getSql } from "@/lib/db";
import { currentDriver } from "@/lib/driver-auth";
import { DriverLoginForm } from "./login-form";
import { StopList } from "./stop-list";

export const instant = false;

export default async function DriverPage() {
  await connection();
  const sql = getSql();
  const driver = await currentDriver();
  if (!driver) {
    const drivers = (await sql`
      select id, name from drivers where active = true order by name
    `) as { id: string; name: string }[];
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-10">
        <h1 className="mb-2 text-3xl font-semibold">Crew</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in with the PIN from the staff office. On iPhone: Share → Add to
          Home Screen.
        </p>
        {drivers.length === 0 ? (
          <p>Ask staff to add a driver with a PIN first.</p>
        ) : (
          <DriverLoginForm drivers={drivers} />
        )}
      </main>
    );
  }

  const today = chicagoYmd();
  const stops = (await sql`
    select j.id, j.starts_at, j.kind, j.status,
           c.name as customer_name, c.phone as customer_phone,
           p.address_line, p.zip
    from jobs j
    join customers c on c.id = j.customer_id
    join properties p on p.id = j.property_id
    where j.completed_at is null
      and j.status <> 'cancelled'
      and (
        j.driver_id = ${driver.id}
        or j.driver_id is null
      )
      and (
        j.starts_at is null
        or timezone('America/Chicago', j.starts_at)::date = ${today}::date
      )
    order by j.starts_at asc nulls last
    limit 50
  `) as {
    id: string;
    starts_at: string | null;
    kind: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    address_line: string;
    zip: string;
  }[];

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <h1 className="mb-1 text-3xl font-semibold">{driver.name}</h1>
      <p className="mb-6 text-sm text-zinc-400">Today’s stops · {today}</p>
      <StopList stops={stops} />
    </main>
  );
}
