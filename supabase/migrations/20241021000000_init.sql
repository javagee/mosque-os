-- Run this in your Supabase SQL editor to set up the database

create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  amount integer not null, -- in pence/cents
  currency text not null default 'gbp',
  category text not null check (category in ('zakat','sadaqah','waqf','lillah','general')),
  type text not null check (type in ('one-time','monthly')),
  stripe_session_id text unique not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'completed',
  created_at timestamptz default now()
);

-- Index for dashboard queries
create index if not exists donors_created_at_idx on donors(created_at desc);
create index if not exists donors_category_idx on donors(category);
create index if not exists donors_email_idx on donors(email);

-- Row level security
alter table donors enable row level security;

-- Only service role can insert/read (webhook uses service role key)
create policy "Service role full access" on donors
  using (true)
  with check (true);

-- ── Coupon Campaigns ──────────────────────────────────────────────────────────

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  merchant_name text not null,
  coupon_price integer not null,      -- in smallest currency unit (cents/pence)
  currency text not null default 'sgd',
  total_coupons integer,              -- null = unlimited
  coupons_sold integer not null default 0,
  redemption_start timestamptz,
  redemption_end timestamptz,
  image_url text,
  terms text[],
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table campaigns enable row level security;
create policy "Service role full access" on campaigns using (true) with check (true);

-- ── Coupons ───────────────────────────────────────────────────────────────────

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,         -- random UUID used as QR code secret
  serial_number text not null,        -- human-readable e.g. "00001"
  campaign_id uuid not null references campaigns(id),
  buyer_name text not null,
  buyer_email text not null,
  stripe_session_id text not null,
  status text not null default 'active' check (status in ('active', 'redeemed', 'expired')),
  redeemed_at timestamptz,
  redeemed_outlet text,
  created_at timestamptz default now()
);

create index if not exists coupons_token_idx on coupons(token);
create index if not exists coupons_campaign_id_idx on coupons(campaign_id);
create index if not exists coupons_stripe_session_id_idx on coupons(stripe_session_id);
create index if not exists coupons_buyer_email_idx on coupons(buyer_email);

alter table coupons enable row level security;
create policy "Service role full access" on coupons using (true) with check (true);
