-- shopping_lists legacy fix: zorgt dat app-kolom `payload` bestaat en bruikbaar is.
-- Oplost o.a.: "Could not find the 'payload' column of 'shopping_lists' in the schema cache"

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shopping_lists
  add column if not exists payload jsonb;

update public.shopping_lists
set payload = '{}'::jsonb
where payload is null;

alter table public.shopping_lists
  alter column payload set default '{}'::jsonb,
  alter column payload set not null;

create index if not exists shopping_lists_user on public.shopping_lists (user_id);
create index if not exists shopping_lists_meal_plan on public.shopping_lists (meal_plan_id);

alter table public.shopping_lists enable row level security;

drop policy if exists "shopping_lists_select_own" on public.shopping_lists;
create policy "shopping_lists_select_own"
on public.shopping_lists for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "shopping_lists_insert_own" on public.shopping_lists;
create policy "shopping_lists_insert_own"
on public.shopping_lists for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "shopping_lists_update_own" on public.shopping_lists;
create policy "shopping_lists_update_own"
on public.shopping_lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "shopping_lists_delete_own" on public.shopping_lists;
create policy "shopping_lists_delete_own"
on public.shopping_lists for delete
to authenticated
using (auth.uid() = user_id);

-- Laat PostgREST direct schema cache herladen.
notify pgrst, 'reload schema';
