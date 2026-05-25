ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS last_habit_notification_date date,
  ADD COLUMN IF NOT EXISTS habit_notifications_count int NOT NULL DEFAULT 0;
