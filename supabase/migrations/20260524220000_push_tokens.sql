CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push token"
  ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.send_notification(user_id uuid, title text, body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
BEGIN
  SELECT pt.token, us.language, us.notifications_enabled
  INTO rec
  FROM public.push_tokens pt
  JOIN public.user_settings us ON us.user_id = pt.user_id
  WHERE pt.user_id = send_notification.user_id;

  IF rec.notifications_enabled THEN
    -- The Edge Function will pick up rows from a notification_queue table
    INSERT INTO public.notification_queue (user_id, token, title, body, language)
    VALUES (user_id, rec.token, title, body, rec.language);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.notification_queue (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
