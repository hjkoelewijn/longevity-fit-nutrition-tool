-- Run in Supabase SQL Editor (one-time)
-- Ensures users can manage their own balance_tests rows under RLS.

alter table public.balance_tests enable row level security;

drop policy if exists "balance_tests_select_own" on public.balance_tests;
create policy "balance_tests_select_own"
on public.balance_tests for select
using (auth.uid() = user_id);

drop policy if exists "balance_tests_insert_own" on public.balance_tests;
create policy "balance_tests_insert_own"
on public.balance_tests for insert
with check (auth.uid() = user_id);

drop policy if exists "balance_tests_update_own" on public.balance_tests;
create policy "balance_tests_update_own"
on public.balance_tests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "balance_tests_delete_own" on public.balance_tests;
create policy "balance_tests_delete_own"
on public.balance_tests for delete
using (auth.uid() = user_id);
