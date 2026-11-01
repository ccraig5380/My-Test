import Link from "next/link";
import { business } from "@/lib/business";
import { HeaderSwarm } from "./header-swarm";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/service-area", label: "Service area" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 overflow-x-clip border-b border-white/10 bg-[#0b1220]/92 backdrop-blur-sm">
      <div className="relative isolate mx-auto max-w-6xl px-6 py-5">
        <HeaderSwarm />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link href="/" className="leading-tight text-white">
            <span className="block text-lg font-semibold tracking-tight">
              {business.name}
            </span>
            <span className="block text-xs uppercase tracking-[0.16em] text-sky-200/80">
              {business.tagline}
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-zinc-200">
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
              className="rounded-sm bg-[var(--accent)] px-4 py-2 font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Book now
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07101c]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-zinc-400 sm:flex-row sm:justify-between">
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
