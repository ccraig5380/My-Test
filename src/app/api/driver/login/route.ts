import { driverCookieName } from "@/lib/driver-auth";
import { getSql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { driverId?: string; pin?: string };
  const pin = body.pin?.replace(/\D/g, "") ?? "";
  if (!body.driverId || pin.length < 4) {
    return NextResponse.json({ error: "Choose your name and PIN" }, { status: 400 });
  }
  const sql = getSql();
  const rows = (await sql`
    select id from drivers
    where id = ${body.driverId} and active = true and pin = ${pin}
    limit 1
  `) as { id: string }[];
  if (!rows[0]) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(driverCookieName(), rows[0].id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
