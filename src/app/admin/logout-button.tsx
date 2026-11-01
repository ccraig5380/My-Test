"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }
  return (
    <button type="button" className="text-sm text-zinc-400 underline" onClick={logout}>
      Log out
    </button>
  );
}
