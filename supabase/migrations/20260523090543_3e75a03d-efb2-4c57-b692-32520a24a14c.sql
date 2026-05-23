
-- Phase 1: Schema extensions

-- HABITS
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS frequency_days int[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS monthly_target int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- NOTES (soft delete + html content + restore flag)
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS content_html text NOT NULL DEFAULT '';

-- SKATING SESSIONS extended fields
ALTER TABLE public.skating_sessions
  ADD COLUMN IF NOT EXISTS rating numeric(3,1),
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS energy int,
  ADD COLUMN IF NOT EXISTS difficulty int,
  ADD COLUMN IF NOT EXISTS went_well text,
  ADD COLUMN IF NOT EXISTS worked text,
  ADD COLUMN IF NOT EXISTS improve text,
  ADD COLUMN IF NOT EXISTS next_goal text,
  ADD COLUMN IF NOT EXISTS location text;

-- SKATING ELEMENTS (custom list per user)
CREATE TABLE IF NOT EXISTS public.skating_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skating_elements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skating elements own all" ON public.skating_elements;
CREATE POLICY "Skating elements own all" ON public.skating_elements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SESSION ↔ ELEMENT with quality
CREATE TABLE IF NOT EXISTS public.skating_session_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.skating_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  element_name text NOT NULL,
  quality text NOT NULL DEFAULT 'Provato',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skating_session_elements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skating session elements own all" ON public.skating_session_elements;
CREATE POLICY "Skating session elements own all" ON public.skating_session_elements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LOCATIONS
CREATE TABLE IF NOT EXISTS public.skating_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skating_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skating locations own all" ON public.skating_locations;
CREATE POLICY "Skating locations own all" ON public.skating_locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SESSION TYPES
CREATE TABLE IF NOT EXISTS public.skating_session_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skating_session_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skating session types own all" ON public.skating_session_types;
CREATE POLICY "Skating session types own all" ON public.skating_session_types
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY,
  theme text NOT NULL DEFAULT 'dark',
  language text NOT NULL DEFAULT 'it',
  notifications_enabled boolean NOT NULL DEFAULT true,
  habit_notifications boolean NOT NULL DEFAULT true,
  evening_summary boolean NOT NULL DEFAULT false,
  evening_time text NOT NULL DEFAULT '21:00',
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User settings own all" ON public.user_settings;
CREATE POLICY "User settings own all" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROFILES: add avatar_url
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- STORAGE buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('note-images', 'note-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user manages their own folder (userId/...)
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars own write" ON storage.objects;
CREATE POLICY "Avatars own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatars own update" ON storage.objects;
CREATE POLICY "Avatars own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatars own delete" ON storage.objects;
CREATE POLICY "Avatars own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Note images public read" ON storage.objects;
CREATE POLICY "Note images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'note-images');

DROP POLICY IF EXISTS "Note images own write" ON storage.objects;
CREATE POLICY "Note images own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Note images own update" ON storage.objects;
CREATE POLICY "Note images own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Note images own delete" ON storage.objects;
CREATE POLICY "Note images own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);
