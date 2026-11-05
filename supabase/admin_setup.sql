create table if not exists public.site_content (
  section text primary key check (
    section in ('packages', 'services', 'reviews', 'cases', 'faqs', 'process', 'clients')
  ),
  content jsonb not null check (jsonb_typeof(content) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.site_content (section, content)
values (
  'packages',
  '[
    {"name":"Starter Acceleration","descriptor":"A focused first step toward predictable growth.","prices":{"USD":{"monthly":1499,"quarterly":1274},"INR":{"monthly":124999,"quarterly":105999}},"features":["1 primary acquisition channel","Up to $8k monthly ad spend","Weekly creative testing","Analytics & CAPI setup","Monthly strategy review"],"cta":"Start accelerating","icon":"↗"},
    {"name":"Growth Scaling","descriptor":"For teams ready to scale what works.","prices":{"USD":{"monthly":2999,"quarterly":2549},"INR":{"monthly":249999,"quarterly":212499}},"features":["2 integrated growth channels","Up to $35k monthly ad spend","Dedicated creative director","CRO landing page optimization","Klaviyo lifecycle flow setup","Weekly growth sprints"],"cta":"Scale with confidence","icon":"✳","popular":true},
    {"name":"Omnichannel Dominance","descriptor":"Your embedded team for category leadership.","prices":{"USD":{"monthly":5499,"quarterly":4674},"INR":{"monthly":459999,"quarterly":389999}},"features":["Unlimited acquisition channels","Advanced programmatic SEO","Custom attribution dashboard","Daily Slack standups","Priority creative production","Executive growth planning"],"cta":"Own your category","icon":"✦"}
  ]'::jsonb
)
on conflict (section) do nothing;

alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "Published site content is readable" on public.site_content;
create policy "Published site content is readable"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
  on public.site_content
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter table public.client_accounts
  drop constraint if exists client_accounts_package_name_check;
alter table public.client_accounts
  add column if not exists email text;
alter table public.client_accounts
  add column if not exists updated_at timestamptz not null default now();
update public.client_accounts as accounts
set email = users.email
from auth.users as users
where accounts.user_id = users.id
  and accounts.email is null;

grant select on public.client_accounts to authenticated;
grant update (package_name, status, updated_at) on public.client_accounts to authenticated;

drop policy if exists "Admins can view all client packages" on public.client_accounts;
create policy "Admins can view all client packages"
  on public.client_accounts
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update client packages" on public.client_accounts;
create policy "Admins can update client packages"
  on public.client_accounts
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Clients can request one package" on public.client_accounts;
create policy "Clients can request one package"
  on public.client_accounts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and email = (auth.jwt() ->> 'email')
    and exists (
      select 1
      from public.site_content as published
      cross join lateral jsonb_array_elements(published.content) as package
      where published.section = 'packages'
        and package ->> 'name' = package_name
    )
  );

-- Bootstrap: create an account in Supabase Auth first, then promote that user's UUID.
-- Find the UUID in Authentication > Users, replace the placeholder, and run:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where id = 'REPLACE-WITH-AUTH-USER-UUID';
--
-- Never expose a Supabase service_role key in browser code.
