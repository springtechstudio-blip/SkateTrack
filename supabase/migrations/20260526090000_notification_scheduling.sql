-- ═══════════════════════════════════════════════════════════════════
-- NOTIFICATION SCHEDULING & CLEANUP
-- ═══════════════════════════════════════════════════════════════════

-- 1. Cleanup function: removes queue entries older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_notification_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notification_queue
  WHERE created_at < now() - interval '7 days';
END;
$$;

-- 2. Send-notifications edge function cleaner: mark stale unsent items
--    Items older than 48h that were never sent get auto-marked
CREATE OR REPLACE FUNCTION public.stale_notification_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notification_queue
  SET sent_at = now()
  WHERE sent_at IS NULL
    AND created_at < now() - interval '48 hours';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- PG_CRON SCHEDULING (requires pg_cron extension)
-- Run these commands AFTER deploying the edge functions:
--
-- 1. Enable pg_cron (one-time, needs superuser):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule the super-processor (every 30 minutes):
--    SELECT cron.schedule(
--      'super-processor',
--      '*/30 * * * *',
--      $$
--      SELECT net.http_post(
--        url:='https://fxgnanzfcoqigqnafxaw.supabase.co/functions/v1/super-processor',
--        headers:='{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Z25hbnpmY29xaWdxbmFmeGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzM4MzYsImV4cCI6MjA5NTEwOTgzNn0.bhLL6i18AMth2eK4-9c_2gBimVHgwX65LDHS5DmEQOI"}'::jsonb
--      )
--      $$::text
--    );
--
-- 3. Schedule the queue sender (every minute):
--    SELECT cron.schedule(
--      'send-notifications',
--      '* * * * *',
--      $$
--      SELECT net.http_post(
--        url:='https://fxgnanzfcoqigqnafxaw.supabase.co/functions/v1/send-notifications',
--        headers:='{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Z25hbnpmY29xaWdxbmFmeGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzM4MzYsImV4cCI6MjA5NTEwOTgzNn0.bhLL6i18AMth2eK4-9c_2gBimVHgwX65LDHS5DmEQOI"}'::jsonb
--      )
--      $$::text
--    );
--
-- 4. Schedule queue cleanup (daily at 3 AM):
--    SELECT cron.schedule(
--      'cleanup-notification-queue',
--      '0 3 * * *',
--      $$SELECT public.cleanup_notification_queue()$$
--    );
--
-- 5. Schedule stale cleanup (every 6 hours):
--    SELECT cron.schedule(
--      'stale-notification-cleanup',
--      '0 */6 * * *',
--      $$SELECT public.stale_notification_cleanup()$$
--    );
--
-- ═══════════════════════════════════════════════════════════════════
-- TO CHECK SCHEDULED JOBS:
--   SELECT * FROM cron.job;
--
-- TO VIEW JOB RUN HISTORY:
--   SELECT * FROM cron.job_run_details ORDER BY run_started_at DESC LIMIT 20;
--
-- TO REMOVE A JOB:
--   SELECT cron.unschedule('job-name');
-- ═══════════════════════════════════════════════════════════════════
