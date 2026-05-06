-- Hervatten onboarding: huidige stap (1–7) na tussentijds stoppen.
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists onboarding_step int default 1;

comment on column public.profiles.onboarding_step is
  'Laatst opgeslagen stap: na voltooien fase N staat dit op N+1 tot max 8 na afronden.';
