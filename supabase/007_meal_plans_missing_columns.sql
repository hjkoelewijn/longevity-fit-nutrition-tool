-- Als meal_plans al bestond zonder Dag-4 kolommen: voeg ze toe.
-- In Supabase SQL Editor: plak ALLEEN de SQL hieronder (niet de bestandsnaam regel).
-- Daarna 1–2 min wachten of Dashboard verversen (schema cache).

alter table public.meal_plans
  add column if not exists cook_sessions_per_week int;

alter table public.meal_plans
  add column if not exists snacks_enabled boolean;

update public.meal_plans
set
  cook_sessions_per_week = coalesce(cook_sessions_per_week, 5),
  snacks_enabled = coalesce(snacks_enabled, false)
where cook_sessions_per_week is null or snacks_enabled is null;

alter table public.meal_plans
  alter column cook_sessions_per_week set default 5,
  alter column cook_sessions_per_week set not null,
  alter column snacks_enabled set default false,
  alter column snacks_enabled set not null;

alter table public.meal_plans
  drop constraint if exists meal_plans_cook_sessions_per_week_check;

alter table public.meal_plans
  add constraint meal_plans_cook_sessions_per_week_check
  check (cook_sessions_per_week in (3, 5, 7));
