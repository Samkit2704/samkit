create table if not exists public.client_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  package_name text not null check (
    package_name in (
      'Starter Acceleration',
      'Growth Scaling',
      'Omnichannel Dominance'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'active', 'paused')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_accounts enable row level security;
revoke all on public.client_accounts from anon;
grant select, insert on public.client_accounts to authenticated;

drop policy if exists "Clients can view their own package" on public.client_accounts;
create policy "Clients can view their own package"
  on public.client_accounts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Clients can request one package" on public.client_accounts;
create policy "Clients can request one package"
  on public.client_accounts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

-- Activate a reviewed request by changing its status to 'active' in the Supabase dashboard.
