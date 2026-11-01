# My Test

First Next.js site for Vercel, with Git as source of truth and Neon as Postgres.

## Local run

Node 22 is installed at `%LOCALAPPDATA%\Programs\node-v22`. Git is at `C:\Program Files\Git\cmd`.

```bash
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/api/health` reports whether Neon is reachable.

## Neon

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the **pooled** connection string.
3. Set `DATABASE_URL` in `.env.local` (local) and in Vercel (Preview + Production).

## Vercel

1. Push this folder to GitHub or GitLab.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add `DATABASE_URL` before the first production deploy.
