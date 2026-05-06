-- Voeg expliciet kinderaantal toe voor stabiele portie-berekening:
-- servings = household_adults + household_children_count

alter table public.profiles
  add column if not exists household_children_count int;

update public.profiles
set household_children_count = coalesce(
  household_children_count,
  case
    when jsonb_typeof(household_children) = 'array' then jsonb_array_length(household_children)
    else 0
  end
)
where household_children_count is null;

alter table public.profiles
  alter column household_children_count set default 0;
