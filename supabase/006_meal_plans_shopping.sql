-- Weekplan (Dag 4): meal_plans + shopping_lists + RLS
-- Run in Supabase SQL Editor na bestaande Day-1 schema.

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  cook_sessions_per_week int not null check (cook_sessions_per_week in (3, 5, 7)),
  snacks_enabled boolean not null default false,
  payload jsonb not null,
  user_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists meal_plans_user_week on public.meal_plans (user_id, week_start desc);
create index if not exists meal_plans_user_created on public.meal_plans (user_id, created_at desc);

alter table public.meal_plans enable row level security;

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
on public.meal_plans for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
on public.meal_plans for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
on public.meal_plans for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "meal_plans_delete_own" on public.meal_plans;
create policy "meal_plans_delete_own"
on public.meal_plans for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

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
