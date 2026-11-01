"use client";

import { SignIn } from "@clerk/nextjs";

export function ClerkSignIn() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return (
    <div className="mb-8">
      <SignIn routing="hash" />
    </div>
  );
}
