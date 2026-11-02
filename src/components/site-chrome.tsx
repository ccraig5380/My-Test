import Link from "next/link";
import { business } from "@/lib/business";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/service-area", label: "Service Area" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-6 py-4 lg:px-12 xl:px-16">
        <Link href="/" className="leading-tight text-white">
          <span className="block text-xl font-semibold tracking-tight sm:text-2xl">
            {business.name}
          </span>
          <span className="block text-sm uppercase tracking-[0.16em] text-sky-200/80">
            {business.tagline}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-base text-zinc-200">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link href="/account" className="hover:text-white">
            Account
          </Link>
          <Link
            href="/signup"
            className="rounded-sm bg-[var(--accent)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07101c]">
      <div className="mx-auto flex w-full flex-col gap-3 px-6 py-10 text-sm text-zinc-400 sm:flex-row sm:justify-between lg:px-12 xl:px-16">
        <p>
          {business.name} · {business.city} · {business.phone}
        </p>
        <div className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/admin">Staff</Link>
        </div>
      </div>
    </footer>
  );
}
