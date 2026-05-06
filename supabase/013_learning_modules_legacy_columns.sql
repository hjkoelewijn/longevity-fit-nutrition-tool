-- learning_modules legacy fix
-- Oplost o.a.: column learning_modules.summary does not exist

alter table public.learning_modules
  add column if not exists summary text;

alter table public.learning_modules
  add column if not exists description text;

alter table public.learning_modules
  add column if not exists category text;

alter table public.learning_modules
  add column if not exists sort_order int;

alter table public.learning_modules
  add column if not exists published boolean default true;

alter table public.learning_modules
  add column if not exists content_md text;

