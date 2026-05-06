-- Legacy meal_plans: kolom end_date bestaat vaak nog als NOT NULL terwijl de app
-- alleen week_start schrijft (Dag-4-schema). Dat geeft: null value in column "end_date".
--
-- Run in Supabase SQL Editor (alleen de SQL). Eerst 008 draaien als week_start nog ontbreekt.
-- Veilig als end_date niet bestaat (bv. schone 006-only tabel).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_plans'
      and column_name = 'end_date'
  ) then
    -- Bestaande rijen: vul end_date als week_start + 6 dagen waar leeg
    update public.meal_plans
    set end_date = (week_start + interval '6 day')::date
    where end_date is null
      and week_start is not null;

    -- Nieuwe inserts hoeven end_date niet meer te zetten
    execute 'alter table public.meal_plans alter column end_date drop not null';
  end if;
end $$;
