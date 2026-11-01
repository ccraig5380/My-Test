import { connection } from "next/server";
import Link from "next/link";
import { business, propertyTypes } from "@/lib/business";
import { getSql } from "@/lib/db";
import { HomeLeadForm } from "./home-lead-form";
import { ReviewsTicker } from "./reviews-ticker";

export const instant = false;

export default async function Home() {
  await connection();
  let reviews: {
    id: string;
    author_name: string;
    location: string | null;
    body: string;
    rating: number;
  }[] = [];
  try {
    const sql = getSql();
    reviews = (await sql`
      select id, author_name, location, body, rating
      from reviews
      where published = true
      order by sort_order asc, created_at desc
      limit 40
    `) as typeof reviews;
  } catch {
    reviews = [];
  }

  return (
    <main>
      <section className="relative flex min-h-[88vh] flex-col justify-end bg-[radial-gradient(ellipse_at_top,_#1a4b8c_0%,_#0b1220_55%,_#07101c_100%)] px-6 pb-20 pt-32">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200/80">
            {business.name} · {business.city}
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            {business.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
            Barrier mosquito spraying for homes, businesses, golf courses, and
            HOAs. Tell us who you are and your acreage — we take it from there.
          </p>
          <HomeLeadForm />
        </div>
      </section>
      <ReviewsTicker reviews={reviews} />
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {propertyTypes.map((type) => (
          <Link
            key={type.id}
            href="/signup"
            className="border border-white/10 bg-white/5 p-8 hover:border-sky-500/60"
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
