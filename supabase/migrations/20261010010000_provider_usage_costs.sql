-- Provider usage telemetry for per-user LLM/API cost visibility.
-- Keep user_id as text because the current app's demo adapter uses non-UUID IDs.
-- No client policies are granted: writes and reads go through the trusted server service-role client.
create table if not exists public.provider_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null,
  model text not null,
  operation text not null,
  status text not null check (status in ('succeeded', 'failed')),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  total_tokens bigint not null default 0 check (total_tokens >= 0),
  cost_usd numeric(18, 10) check (cost_usd is null or cost_usd >= 0),
  cost_status text not null default 'unpriced' check (cost_status in ('estimated', 'unpriced')),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  pricing_source text,
  created_at timestamptz not null default now()
);

create index if not exists provider_usage_events_created_idx
  on public.provider_usage_events(created_at desc);
create index if not exists provider_usage_events_user_created_idx
  on public.provider_usage_events(user_id, created_at desc);
create index if not exists provider_usage_events_provider_model_idx
  on public.provider_usage_events(provider, model, created_at desc);

alter table public.provider_usage_events enable row level security;
revoke all on public.provider_usage_events from anon, authenticated;
grant all on public.provider_usage_events to service_role;
