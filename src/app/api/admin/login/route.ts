import { adminCookieName, adminCookieValue } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expected = adminCookieValue();
  if (!expected) {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD in the environment." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as { password?: string };
  if (body.password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
