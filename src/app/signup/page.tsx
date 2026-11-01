import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Book service" };

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Book monthly service</h1>
      <p className="mt-3 mb-10 text-zinc-300">
        Acreage is required. Under 5 acres subscribe online; the office puts
        you on the spray calendar. 5+ acres are quoted by staff.
      </p>
      <Suspense>
        <SignupForm />
      </Suspense>
    </main>
  );
}
