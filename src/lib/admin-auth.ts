import { cookies } from "next/headers";

const COOKIE = "hmc_admin";

export function adminCookieValue() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  return secret;
}

export async function isAdmin() {
  const expected = adminCookieValue();
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === expected;
}

export function adminCookieName() {
  return COOKIE;
}
