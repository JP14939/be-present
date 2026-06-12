-- Add points to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0;
