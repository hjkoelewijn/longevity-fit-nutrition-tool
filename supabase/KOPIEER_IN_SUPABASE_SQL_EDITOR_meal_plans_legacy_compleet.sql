-- =============================================================================
-- LONGEVITY FIT — meal_plans legacy → Dag-4 app (alles-in-één)
-- =============================================================================
-- Kopieer dit HELE bestand in Supabase → SQL Editor → Run (één keer, mag vaker).
-- Lost o.a. op: ontbrekende week_start/payload/user_meta, cook_sessions/snacks,
--               NOT NULL op oude kolommen start_date / end_date / meals.
-- Veilig als je al delen van 006–010 hebt gedraaid (idempotent waar mogelijk).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Dag-4 kolommen cook_sessions_per_week + snacks_enabled (007-logica)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- B) week_start, payload, user_meta + backfill (008-logica)
-- -----------------------------------------------------------------------------
alter table public.meal_plans
  add column if not exists week_start date;

alter table public.meal_plans
  add column if not exists payload jsonb;

alter table public.meal_plans
  add column if not exists user_meta jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_plans'
      and column_name = 'start_date'
  ) then
    update public.meal_plans
    set week_start = (start_date::date)
    where week_start is null
      and start_date is not null;
  end if;
end $$;

update public.meal_plans
set week_start = (created_at::date)
where week_start is null;

update public.meal_plans
set payload = '{}'::jsonb
where payload is null;

update public.meal_plans
set user_meta = '{}'::jsonb
where user_meta is null;

alter table public.meal_plans
  alter column week_start set not null,
  alter column payload set not null,
  alter column user_meta set not null;

-- -----------------------------------------------------------------------------
-- C) Legacy kolom `meals` (oude schema): unblock inserts zonder deze kolom
-- -----------------------------------------------------------------------------
do $$
declare
  dt text;
begin
  select c.data_type into dt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'meal_plans'
    and c.column_name = 'meals';

  if dt = 'jsonb' then
    execute $q$
      update public.meal_plans
      set meals = coalesce(meals, '[]'::jsonb)
      where meals is null
    $q$;
    execute 'alter table public.meal_plans alter column meals drop not null';
  elsif dt = 'json' then
    execute $q$
      update public.meal_plans
      set meals = coalesce(meals, '[]'::json)
      where meals is null
    $q$;
    execute 'alter table public.meal_plans alter column meals drop not null';
  elsif dt is not null then
    execute 'alter table public.meal_plans alter column meals drop not null';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- D) Legacy start_date + end_date: vullen waar nodig, daarna NOT NULL weg
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_plans'
      and column_name = 'start_date'
  ) then
    update public.meal_plans
    set start_date = week_start
    where start_date is null
      and week_start is not null;

    execute 'alter table public.meal_plans alter column start_date drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_plans'
      and column_name = 'end_date'
  ) then
    update public.meal_plans
    set end_date = (week_start + interval '6 day')::date
    where end_date is null
      and week_start is not null;

    execute 'alter table public.meal_plans alter column end_date drop not null';
  end if;
end $$;

-- Klaar. Test: weekplan opnieuw genereren in de app.
