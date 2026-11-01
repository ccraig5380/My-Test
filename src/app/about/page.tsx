import type { Metadata } from "next";
import { business } from "@/lib/business";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="leading-7 text-zinc-300">
        {business.name} provides recurring mosquito barrier treatments in{" "}
        {business.city}. Replace this copy with your story, insurance, and
        technicians.
      </p>
      <p className="text-sm text-zinc-700">
        {business.licenseLabel}: {business.licenseNumber}
      </p>
      <p className="text-sm text-zinc-700">
        {business.phone} · {business.email}
      </p>
    </main>
  );
}
