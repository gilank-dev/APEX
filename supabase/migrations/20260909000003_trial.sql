-- 20260909000003_trial.sql
-- Add 14-day Pro trial timestamp column to companies table

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
