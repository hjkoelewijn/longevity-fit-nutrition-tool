-- Run in Supabase SQL Editor after Day 1 schema.
-- Aligns catalog tables + RLS for receptenbibliotheek en leermodules.

-- --- recipes: kolommen voor filters & detail (veilig herhaalbaar) ---
alter table public.recipes
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists meal_type text,
  add column if not exists season text,
  add column if not exists diet_styles text[] default '{}'::text[],
  add column if not exists prep_time_minutes int,
  add column if not exists servings int default 4,
  add column if not exists ingredients jsonb default '[]'::jsonb,
  add column if not exists instructions text,
  add column if not exists kid_tip text;

-- Unieke slug indien kolom nieuw is (meerdere NULL mag)
create unique index if not exists recipes_slug_unique on public.recipes (slug)
  where slug is not null and length(trim(slug)) > 0;

alter table public.recipes enable row level security;

drop policy if exists "recipes_select_authenticated" on public.recipes;
create policy "recipes_select_authenticated"
on public.recipes for select
to authenticated
using (true);

-- --- learning_modules ---
alter table public.learning_modules
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists content_md text,
  add column if not exists sort_order int default 0,
  add column if not exists published boolean default true;

create unique index if not exists learning_modules_slug_unique
  on public.learning_modules (slug)
  where slug is not null and length(trim(slug)) > 0;

alter table public.learning_modules enable row level security;

drop policy if exists "learning_modules_select_published" on public.learning_modules;
create policy "learning_modules_select_published"
on public.learning_modules for select
to authenticated
using (coalesce(published, true) = true);

-- --- module_completions (eigen voortgang) ---
alter table public.module_completions enable row level security;

drop policy if exists "module_completions_select_own" on public.module_completions;
create policy "module_completions_select_own"
on public.module_completions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "module_completions_insert_own" on public.module_completions;
create policy "module_completions_insert_own"
on public.module_completions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "module_completions_update_own" on public.module_completions;
create policy "module_completions_update_own"
on public.module_completions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "module_completions_delete_own" on public.module_completions;
create policy "module_completions_delete_own"
on public.module_completions for delete
to authenticated
using (auth.uid() = user_id);

create unique index if not exists module_completions_user_module_key
  on public.module_completions (user_id, module_id);

-- --- optioneel: voorbeeldrecepten (alleen als tabel leeg genoeg is) ---
insert into public.recipes (title, slug, summary, meal_type, season, diet_styles, prep_time_minutes, servings, instructions, kid_tip)
select * from (values
  (
    'Gegrilde zalm met groene asperges',
    'gegrilde-zalm-groene-asperges',
    'Omega-3 rijk diner, licht en seizoensgebonden.',
    'diner',
    'lente',
    array['flexitariër'::text, 'pescotariër'],
    35,
    4,
    'Bereid asperges. Bak of grill de zalm kort. Serveer met olijfolie en citroen.',
    'Kinderen: klein stukje zalm, asperges in vingersnippers.'
  ),
  (
    'Haverpap met rood fruit',
    'haverpap-rood-fruit',
    'Rustig ontbijt met vezels, zonder geraffineerde suikers.',
    'ontbijt',
    'winter',
    array['vegetarisch'],
    15,
    2,
    'Kook haver met plantaardige melk. Top af met rood fruit en kaneel.',
    null
  )
) as v(title, slug, summary, meal_type, season, diet_styles, prep_time_minutes, servings, instructions, kid_tip)
where not exists (select 1 from public.recipes limit 1);

insert into public.learning_modules (title, slug, summary, content_md, sort_order, published)
select * from (values
  (
    'Waarom maximaal 4 eetmomenten',
    'max-vier-eetmomenten',
    'Het ritme van eten en waarom dat bij Longevity Fit telt.',
    E'# Vier eetmomenten\n\nJe geeft je spijsvertering rust tussen de maaltijden en voorkomt **grazing** uit gewoonte.\n\n- Echte trek vs gewoonte\n- Hoe snacks je hormonen kunnen raken',
    1,
    true
  ),
  (
    'Koolhydraten: 1–2 momenten per dag',
    'koolhydraten-momenten',
    'Praktische basis voor stabiele energie.',
    E'# Koolhydraatmomenten\n\nNiet tellen in grammen, wel **kiezen** wanneer je ze eet.\n\n- Ontbijt of lunch als koolhydraatmoment\n- Avond lichter indien dat bij jou past',
    2,
    true
  )
) as v(title, slug, summary, content_md, sort_order, published)
where not exists (select 1 from public.learning_modules limit 1);
