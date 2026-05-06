-- Als public.meal_plans een OUD schema heeft (start_date, end_date, meals, …)
-- maar de app het Dag-4-schema verwacht (week_start, payload, user_meta, …):
-- voeg ontbrekende kolommen toe en vul week_start waar mogelijk vanuit start_date.
-- Run in Supabase SQL Editor (alleen de SQL, geen bestandsnaam plakken).
--
-- Let op: kolommen als start_date / meals blijven staan maar worden door de app niet gebruikt.
-- Wil je 100% schone tabel zonder oude kolommen: backup data, DROP TABLE meal_plans (+ shopping_lists), daarna volledig 006_meal_plans_shopping.sql draaien.

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

-- Legacy NOT NULL (start_date / end_date / …): gebruik
-- supabase/KOPIEER_IN_SUPABASE_SQL_EDITOR_meal_plans_legacy_compleet.sql (alles-in-één).
