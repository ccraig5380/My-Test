type Review = {
  id: string;
  author_name: string;
  location: string | null;
  body: string;
  rating: number;
};

export function ReviewsTicker({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const loop = [...reviews, ...reviews];

  return (
    <section className="border-y border-white/10 bg-[#162338] py-10">
      <div className="mx-auto mb-6 w-full px-6 lg:px-12 xl:px-16">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200/80">
          Customer reviews
        </h2>
      </div>
      <div className="reviews-marquee overflow-x-clip">
        <ul className="reviews-track flex w-max gap-4 px-4">
          {loop.map((review, index) => (
            <li
              key={`${review.id}-${index}`}
              className="w-80 shrink-0 border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sky-300" aria-label={`${Number(review.rating)} out of 5 stars`}>
                {"★".repeat(Number(review.rating))}
                {"☆".repeat(5 - Number(review.rating))}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-100">“{review.body}”</p>
              <p className="mt-4 text-sm font-semibold text-white">
                {review.author_name}
                {review.location ? (
                  <span className="font-normal text-zinc-400">
                    {" "}
                    · {review.location}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
