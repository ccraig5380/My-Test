import { connection } from "next/server";
import Link from "next/link";
import { business, propertyTypes } from "@/lib/business";
import { getSql } from "@/lib/db";
import { HeaderSwarm } from "@/components/header-swarm";
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
      <section className="relative flex min-h-[88vh] flex-col bg-[radial-gradient(ellipse_at_top,_#1a4b8c_0%,_#0b1220_55%,_#07101c_100%)] pb-20">
        <div className="relative h-40 w-full shrink-0 overflow-x-clip sm:h-52">
          <HeaderSwarm />
        </div>
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200/80">
            {business.name} · {business.city}
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            {business.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
            No one is more diligent about protecting pollinators than Mosquito
            Maniacs. And if mosquitoes still show up between services, we come
            back and spray for free — that is our No Bite Guarantee.
          </p>
          <ul className="mt-8 flex max-w-2xl flex-col gap-3 text-base font-medium tracking-wide text-sky-100">
            {[
              { prefix: "", strong: "NO BITE", suffix: " Guarantee" },
              { prefix: "EPA ", strong: "Approved", suffix: "" },
              { prefix: "", strong: "Safe", suffix: " for pets and livestock" },
              { prefix: "", strong: "Licensed", suffix: " technicians" },
            ].map((item) => (
              <li key={item.strong} className="flex items-center gap-3">
                <img
                  src="/brand/mosquito-bullet.png"
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <span>
                  {item.prefix}
                  <strong className="font-bold text-sky-200">{item.strong}</strong>
                  {item.suffix}
                </span>
              </li>
            ))}
          </ul>
          <HomeLeadForm />
        </div>
      </section>
      <ReviewsTicker reviews={reviews} />
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {propertyTypes.map((type) => (
          <Link
            key={type.id}
            href={`/signup?propertyType=${type.id}`}
            className="group relative min-h-56 overflow-hidden border border-white/10 bg-cover bg-center p-8 text-white"
            style={{ backgroundImage: `url(${type.image})` }}
          >
            <span className="absolute inset-0 bg-[#07101c]/55 transition-colors group-hover:bg-[#07101c]/35" />
            <span className="relative z-10 block">
              <h2 className="text-2xl font-semibold">{type.label}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-100">
                Under 5 acres books online. 5+ acres go to a staff quote.
              </p>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
