-- BizMate AI initial Supabase schema.
-- Apply only after reviewing this migration in a non-production environment.
-- User identity is Supabase Auth UUID; never trust x-user-id supplied by clients.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  plan_id text not null check (plan_id in ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')),
  status text not null default 'INCOMPLETE' check (status in ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_credits integer not null default 0 check (total_credits >= 0),
  used_credits integer not null default 0 check (used_credits >= 0),
  reserved_credits integer not null default 0 check (reserved_credits >= 0),
  updated_at timestamptz not null default now(),
  check (used_credits + reserved_credits <= total_credits)
);

create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  entry_type text not null check (entry_type in ('PLAN_ALLOCATION', 'RESERVATION', 'CONSUMPTION', 'REFUND', 'ADJUSTMENT')),
  description text not null,
  job_id uuid,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  job_type text not null,
  prompt text not null,
  business_requirement text,
  options jsonb not null default '{}'::jsonb,
  credits_cost integer not null default 0 check (credits_cost >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED')),
  provider text,
  provider_classification text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usage_ledger add constraint usage_ledger_job_id_fkey
  foreign key (job_id) references public.generation_jobs(id) on delete set null;

create table if not exists public.generation_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  output_type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  asset_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  job_id uuid references public.generation_jobs(id) on delete set null,
  name text not null,
  asset_type text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.generation_outputs add constraint generation_outputs_asset_id_fkey
  foreign key (asset_id) references public.assets(id) on delete set null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  provider_signature_verified boolean not null default false,
  amount_paise bigint not null check (amount_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'CREATED' check (status in ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED')),
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists subscriptions_user_created_idx on public.subscriptions(user_id, created_at desc);
create index if not exists usage_ledger_user_created_idx on public.usage_ledger(user_id, created_at desc);
create index if not exists generation_jobs_user_created_idx on public.generation_jobs(user_id, created_at desc);
create index if not exists generation_outputs_user_created_idx on public.generation_outputs(user_id, created_at desc);
create index if not exists assets_user_created_idx on public.assets(user_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments(user_id, created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_user_id, created_at desc);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.organization_members m where m.organization_id = target_org and m.user_id = auth.uid()); $$;

create or replace function public.is_org_owner(target_org uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.organizations o where o.id = target_org and o.owner_id = auth.uid()); $$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_balances enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.generation_outputs enable row level security;
alter table public.assets enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "organizations_select_member" on public.organizations for select to authenticated using (owner_id = auth.uid() or public.is_org_member(id));
create policy "organizations_insert_owner" on public.organizations for insert to authenticated with check (owner_id = auth.uid());
create policy "organizations_update_owner" on public.organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members_select_org" on public.organization_members for select to authenticated using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_org_owner(organization_id));
create policy "members_insert_owner" on public.organization_members for insert to authenticated with check (public.is_org_owner(organization_id));
create policy "members_delete_owner" on public.organization_members for delete to authenticated using (public.is_org_owner(organization_id));
create policy "subscriptions_select_self" on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "usage_balances_select_self" on public.usage_balances for select to authenticated using (user_id = auth.uid());
create policy "usage_ledger_select_self" on public.usage_ledger for select to authenticated using (user_id = auth.uid());
create policy "jobs_select_self" on public.generation_jobs for select to authenticated using (user_id = auth.uid());
create policy "jobs_insert_self" on public.generation_jobs for insert to authenticated with check (user_id = auth.uid());
create policy "jobs_update_self" on public.generation_jobs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "outputs_select_self" on public.generation_outputs for select to authenticated using (user_id = auth.uid());
create policy "assets_select_self" on public.assets for select to authenticated using (user_id = auth.uid());
create policy "payments_select_self" on public.payments for select to authenticated using (user_id = auth.uid());
create policy "audit_logs_select_self" on public.audit_logs for select to authenticated using (actor_user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, delete on public.organization_members to authenticated;
grant select on public.subscriptions, public.usage_balances, public.usage_ledger, public.generation_outputs, public.assets, public.payments, public.audit_logs to authenticated;
grant select, insert, update on public.generation_jobs to authenticated;

-- Credit mutation, payment verification, and audit writes must go through trusted server-side code or reviewed RPCs.
-- Never expose service-role credentials to browser code or trust payment success reported by a client.
