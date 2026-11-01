import Link from "next/link";
import { business, propertyTypes } from "@/lib/business";

export default function Home() {
  return (
    <main>
      <section className="relative flex min-h-[88vh] flex-col justify-end bg-[radial-gradient(ellipse_at_top,_#2a4a28_0%,_#121512_55%,_#0c0e0c_100%)] px-6 pb-20 pt-32">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-200/80">
            {business.city} mosquito barrier spraying
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Keep yards, clubs, and HOAs from becoming mosquito ground.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
            {business.tagline} Pick your acreage, grab a first visit, and we
            come back on a monthly route.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-sm bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              Book now
            </Link>
            <Link
              href="/services"
              className="rounded-sm border border-white/30 px-8 py-4 text-base font-semibold text-white"
            >
              See plans
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {propertyTypes.map((type) => (
          <Link
            key={type.id}
            href="/signup"
            className="border border-white/10 bg-white/5 p-8 hover:border-green-700/60"
          >
            <h2 className="text-2xl font-semibold text-white">{type.label}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Under 5 acres books online. 5+ acres go to a staff quote.
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
