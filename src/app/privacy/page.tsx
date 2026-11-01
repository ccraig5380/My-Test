import type { Metadata } from "next";
import { business } from "@/lib/business";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-sm leading-7 text-zinc-700">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Privacy policy
      </h1>
      <p>
        {business.name} collects name, phone, email, and service address to
        schedule mosquito treatments in {business.city}. We store that
        information in our database. Payment cards are processed by Stripe. We
        do not store full card numbers.
      </p>
      <p>
        We use the data to provide service, send visit reminders, and bill the
        subscription you started. Staff can see jobs and quote requests. We do
        not sell personal information.
      </p>
      <p>
        Contact {business.email} to review or correct your information. This
        page is an operational draft until counsel reviews it.
      </p>
    </main>
  );
}
