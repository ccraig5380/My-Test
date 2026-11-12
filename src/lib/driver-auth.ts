import { cookies } from "next/headers";
import { getSql } from "@/lib/db";

const COOKIE = "hmc_driver";

export function driverCookieName() {
  return COOKIE;
}

export async function currentDriver() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const sql = getSql();
  const rows = (await sql`
    select id, name, zone, active
    from drivers
    where id = ${id} and active = true
    limit 1
  `) as { id: string; name: string; zone: string; active: boolean }[];
  return rows[0] ?? null;
}
