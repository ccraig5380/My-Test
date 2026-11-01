import { DbStatus } from "./db-status";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-8 py-24">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Rollout
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            My Test
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Next.js app hosted on Vercel, source in Git, Postgres on Neon.
          </p>
          <DbStatus />
        </div>
        <ol className="list-decimal space-y-3 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>Create a Neon project and copy the pooled connection string.</li>
          <li>
            Put it in <code className="font-mono text-sm">.env.local</code> as{" "}
            <code className="font-mono text-sm">DATABASE_URL</code>.
          </li>
          <li>Push this repo and import it on Vercel.</li>
          <li>Set the same env var in Vercel Production and Preview.</li>
        </ol>
      </main>
    </div>
  );
}
