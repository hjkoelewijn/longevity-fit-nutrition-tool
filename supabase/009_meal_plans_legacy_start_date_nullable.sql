-- Legacy meal_plans: kolom start_date bestaat vaak nog als NOT NULL terwijl de app
-- alleen week_start schrijft (Dag-4-schema). Dat geeft: null value in column "start_date".
--
-- Run in Supabase SQL Editor (alleen de SQL). Eerst 008 draaien als week_start nog ontbreekt.
-- Veilig als start_date niet bestaat (bv. schone 006-only tabel).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_plans'
      and column_name = 'start_date'
  ) then
    -- Bestaande rijen: vul start_date vanuit week_start waar leeg
    update public.meal_plans
    set start_date = week_start
    where start_date is null
      and week_start is not null;

    -- Nieuwe inserts hoeven start_date niet meer te zetten
    execute 'alter table public.meal_plans alter column start_date drop not null';
  end if;
end $$;
