-- Enable btree_gist extension for PostgreSQL exclusion constraint (prevents double bookings)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student_coordinator' CHECK (role IN ('student_coordinator', 'school_admin')),
  club_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin'
  ));

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  building TEXT NOT NULL DEFAULT 'Main Campus',
  floor INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 30,
  has_projector BOOLEAN NOT NULL DEFAULT true,
  has_ac BOOLEAN NOT NULL DEFAULT true,
  has_whiteboard BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Everyone logged in can view rooms
CREATE POLICY "Allow authenticated users to read rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage rooms
CREATE POLICY "Allow admins to insert/update/delete rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin'
  ));

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  
  -- Time validity check
  CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- 4. HARDWARE/DATABASE LEVEL DOUBLE-BOOKING EXCLUSION CONSTRAINT
-- Prevents any two approved bookings for the same room from overlapping in time
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS no_overlapping_approved_bookings;

ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_approved_bookings
EXCLUDE USING gist (
  room_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
WHERE (status = 'approved');

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone can see approved bookings (for calendar). Users can see own bookings. Admins can see all.
CREATE POLICY "Allow read bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    status = 'approved' 
    OR auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin')
  );

-- Create policy: Coordinators can insert pending bookings
CREATE POLICY "Allow coordinators to insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (status = 'pending' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin'))
  );

-- Update policy: Users can cancel their own pending/approved bookings. Admins can approve/reject any.
CREATE POLICY "Allow update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin')
  );

-- 5. TRIGGER FOR NEW SIGNUPS -> PUBLIC.PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student_coordinator')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SAMPLE SEED DATA FOR STRATEGY FIRST CAMPUS
INSERT INTO public.rooms (name, building, floor, capacity, has_projector, has_ac, has_whiteboard, notes)
VALUES
  ('Room 101', 'Main Building', 1, 40, true, true, true, 'Near main entrance'),
  ('Room 102', 'Main Building', 1, 35, true, true, true, 'Standard classroom'),
  ('Room 201', 'Main Building', 2, 50, true, true, true, 'Large lecture hall'),
  ('Room 202', 'Main Building', 2, 30, true, true, true, 'Seminar room'),
  ('Computer Lab 1', 'Technology Wing', 2, 30, true, true, true, 'Equipped with 30 desktop PCs'),
  ('Auditorium', 'Main Building', 3, 120, true, true, true, 'For major events and orientations')
ON CONFLICT (name) DO NOTHING;
