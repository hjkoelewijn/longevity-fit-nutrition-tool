-- Run in Supabase SQL Editor (one-time)
-- Adds fields needed for PRD onboarding fase 7 (keuze + supplementen) without overloading unrelated columns.

alter table public.profiles
  add column if not exists balance_test_choice text,
  add column if not exists supplements_used jsonb default '[]'::jsonb;
