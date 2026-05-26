-- Coach mode + competitions + athletes

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS coach_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text;

CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Competitions own all" ON public.competitions;
CREATE POLICY "Competitions own all" ON public.competitions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Athletes own all" ON public.athletes;
CREATE POLICY "Athletes own all" ON public.athletes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.training_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  rating int,
  paid boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Training attendance own all" ON public.training_attendance;
CREATE POLICY "Training attendance own all" ON public.training_attendance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
