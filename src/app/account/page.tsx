import { AccountClient } from "./account-client";

export const instant = false;

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Your account</h1>
      <p className="mt-3 mb-8 text-zinc-300">
        Look up visits by the email on your request. Card billing (pause,
        cancel, update card) will use Stripe when that is connected.
      </p>
      <AccountClient />
    </main>
  );
}
