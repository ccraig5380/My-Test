-- Houston mosquito operations database.
-- This is the source of truth. Apply in the Neon SQL Editor, not from the website UI.
-- The Next.js app only reads and writes these tables.

create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  stripe_customer_id text unique,
  clerk_user_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_idx on customers (lower(email));

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  property_type text not null,
  acreage_band text not null,
  acreage_exact numeric,
  address_line text not null,
  zip text not null,
  zone text not null default 'houston',
  preferred_days text,
  created_at timestamptz not null default now()
);

create table if not exists quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  address_line text not null,
  zip text not null,
  property_type text not null,
  acreage_band text not null default '5_plus',
  acreage_exact numeric not null,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'incomplete',
  interval text not null default 'month',
  created_at timestamptz not null default now()
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  zone text not null default 'houston',
  weekday smallint not null,
  start_minute smallint not null,
  end_minute smallint not null
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone text not null default 'houston',
  max_jobs_per_day integer not null default 8,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'needs_schedule',
  tech_name text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jobs_starts_idx on jobs (starts_at);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text
);

create index if not exists interactions_occurred_idx on interactions (occurred_at desc);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  location text,
  body text not null,
  rating smallint not null default 5,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reviews_published_idx on reviews (published, sort_order, created_at desc);

insert into availability_rules (zone, weekday, start_minute, end_minute)
select 'houston', d, 480, 960
from generate_series(1, 5) as d
where not exists (select 1 from availability_rules);
